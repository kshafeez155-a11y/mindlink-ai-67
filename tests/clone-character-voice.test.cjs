const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function compile(path) {
  return ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}
const code = compile("supabase/functions/clone-character-voice/index.ts");
const recordingContext = { exports: {}, require: () => ({}), Blob, DataView, ArrayBuffer };
vm.runInNewContext(compile("src/hooks/use-voice-recording.ts"), recordingContext);
const encode = recordingContext.exports.encodeVoiceWav;

function recorderHarness({ denied = false, delayed = false } = {}) {
  const slots = [],
    effects = [],
    cleanups = [];
  let cursor = 0,
    recorder,
    permissionCalls = 0,
    stopped = 0,
    closed = 0,
    grant;
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [
        slots[i],
        (value) => {
          slots[i] = typeof value === "function" ? value(slots[i]) : value;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || deps.some((d, n) => d !== slots[i][n])) {
        slots[i] = deps;
        effects.push(() => {
          cleanups[i]?.();
          cleanups[i] = fn();
        });
      }
    },
  };
  const stream = { getTracks: () => [{ stop: () => stopped++ }] };
  class Recorder {
    static isTypeSupported(type) {
      return type === "audio/webm;codecs=opus";
    }
    constructor(_stream, options) {
      recorder = this;
      this.mimeType = options.mimeType;
      this.state = "inactive";
    }
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      this.finished = this.onstop?.();
    }
  }
  class Context {
    state = "running";
    async close() {
      this.state = "closed";
      closed++;
    }
    async decodeAudioData() {
      return {
        length: 8000,
        duration: 1,
        sampleRate: 8000,
        numberOfChannels: 1,
        getChannelData: () => new Float32Array(8000),
      };
    }
  }
  const context = {
    exports: {},
    require: () => react,
    Blob,
    DataView,
    ArrayBuffer,
    DOMException,
    window: { MediaRecorder: Recorder, AudioContext: Context },
    MediaRecorder: Recorder,
    AudioContext: Context,
    navigator: {
      mediaDevices: {
        getUserMedia: async () => {
          permissionCalls++;
          if (denied) throw new DOMException("Denied", "NotAllowedError");
          if (delayed)
            return new Promise((resolve) => {
              grant = () => resolve(stream);
            });
          return stream;
        },
      },
    },
    URL: { createObjectURL: () => "blob:local-test", revokeObjectURL() {} },
    performance: { now: () => 0 },
    setInterval: () => 1,
    clearInterval() {},
  };
  vm.runInNewContext(compile("src/hooks/use-voice-recording.ts"), context);
  const render = () => {
    cursor = 0;
    const result = context.exports.useVoiceRecording();
    while (effects.length) effects.shift()();
    return result;
  };
  render();
  return {
    render,
    get recorder() {
      return recorder;
    },
    get calls() {
      return permissionCalls;
    },
    get stopped() {
      return stopped;
    },
    get closed() {
      return closed;
    },
    grant: () => grant(),
    unmount: () => cleanups.forEach((fn) => fn?.()),
  };
}
const id = "00000000-0000-4000-8000-000000000001";
function wav() {
  return encode({
    length: 8000,
    sampleRate: 8000,
    numberOfChannels: 1,
    getChannelData: () => new Float32Array(8000).fill(0.25),
  });
}
function fixture(options = {}) {
  const state = {
    role: options.role ?? "creator",
    owner: options.owner ?? true,
    row: {
      id,
      creator_id: "owner-record",
      name: "Creator AI",
      voice_status: options.oldVoice ? "ready" : "not_setup",
      voice_id: options.oldVoice ?? null,
      voice_provider: options.oldVoice ? "cartesia" : null,
    },
    calls: 0,
    updates: [],
    logs: [],
  };
  const admin = {
    from(table) {
      const filters = [];
      let update;
      const q = {
        select() {
          return q;
        },
        eq(key, value) {
          filters.push([key, value]);
          return q;
        },
        is(key, value) {
          filters.push([key, value]);
          return q;
        },
        update(value) {
          update = value;
          return q;
        },
        async maybeSingle() {
          if (table === "profiles") return { data: { account_type: state.role }, error: null };
          if (table === "creators")
            return { data: state.owner ? { id: "owner-record" } : null, error: null };
          assert.equal(table, "characters");
          if (
            filters.some(([key, value]) =>
              key === "creators.user_id" ? !state.owner : state.row[key] !== value,
            )
          )
            return { data: null, error: null };
          if (update) {
            if (options.failSave && update.voice_status === "ready")
              return { data: null, error: { message: "database error" } };
            state.updates.push({ ...update });
            Object.assign(state.row, update);
          }
          return { data: { ...state.row }, error: null };
        },
      };
      return q;
    },
  };
  const context = {
    exports: {},
    Response,
    Request,
    FormData,
    File,
    Uint8Array,
    DataView,
    TextDecoder,
    AbortSignal,
    btoa,
    console: { error: (event, details) => state.logs.push({ event, ...details }) },
    Deno: {
      env: {
        get: (name) =>
          name === "CARTESIA_API_KEY" ? (options.missingKey ? undefined : "test-secret") : name,
      },
      serve() {},
    },
    require: () => ({
      createClient: (_url, key) =>
        key === "SUPABASE_ANON_KEY"
          ? {
              auth: {
                getUser: async () => ({
                  data: { user: options.badJwt ? null : { id: "authenticated-user" } },
                  error: null,
                }),
              },
            }
          : admin,
    }),
    fetch: async (url, request) => {
      state.calls++;
      assert.equal(url, "https://api.cartesia.ai/voices/clone");
      assert.equal(request.headers["Cartesia-Version"], "2026-08-14");
      assert.equal(request.headers.Authorization, "Bearer test-secret");
      assert.equal(request.body.get("name"), "Creator AI");
      assert.equal(request.body.get("language"), "en");
      assert.equal(request.body.get("access"), "private");
      assert.equal(request.body.get("clip").type, "audio/wav");
      assert.equal(state.row.voice_status, "processing");
      if (options.oldVoice) assert.equal(state.row.voice_id, options.oldVoice);
      if (options.revoke) state.owner = false;
      if (options.throwProvider) throw new Error("private provider diagnostics");
      if (options.providerBody !== undefined)
        return new Response(
          typeof options.providerBody === "string"
            ? options.providerBody
            : JSON.stringify(options.providerBody),
          {
            status: options.providerStatus ?? 422,
            headers: { "Content-Type": options.providerContentType ?? "application/json" },
          },
        );
      return new Response(
        JSON.stringify(
          options.invalidResponse ? {} : { id: "new-provider-voice", secret: "must not leak" },
        ),
        { status: options.providerFail ? 500 : 200 },
      );
    },
  };
  vm.runInNewContext(code, context);
  function request(extra = {}) {
    const body = new FormData();
    body.set("character_id", extra.characterId ?? id);
    body.set("audio", extra.audio ?? wav(), "voice.wav");
    body.set("consent", extra.consent ?? "true");
    body.set("language", "en");
    if (extra.replace) body.set("replace", "true");
    return new Request("https://example.test/clone", {
      method: "POST",
      headers: extra.guest ? {} : { Authorization: "Bearer user-jwt" },
      body,
    });
  }
  return { state, run: (extra) => context.exports.handleClone(request(extra)) };
}

test("JWT and creator ownership are required before any update/provider call", async () => {
  for (const [options, input, expected] of [
    [{}, { guest: true }, 401],
    [{ badJwt: true }, {}, 401],
    [{ role: "user" }, {}, 403],
    [{ owner: false }, {}, 403],
  ]) {
    const f = fixture(options);
    assert.equal((await f.run(input)).status, expected);
    assert.equal(f.state.calls, 0);
    assert.equal(f.state.updates.length, 0);
  }
});
test("consent, UUID, genuine WAV and replacement confirmation are validated", async () => {
  for (const [options, input, status] of [
    [{}, { consent: "false" }, 400],
    [{}, { characterId: "slug" }, 400],
    [{}, { audio: new Blob(["not audio"], { type: "audio/wav" }) }, 400],
    [{ oldVoice: "old" }, {}, 409],
  ]) {
    const f = fixture(options);
    assert.equal((await f.run(input)).status, status);
    assert.equal(f.state.calls, 0);
  }
});
test("success sends current private Cartesia multipart format and only returns safe fields", async () => {
  const f = fixture();
  const result = await f.run();
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { success: true, voice_status: "ready" });
  assert.equal(f.state.row.voice_id, "new-provider-voice");
  assert.equal(f.state.row.voice_provider, "cartesia");
  assert.deepEqual(
    f.state.updates.map((u) => u.voice_status),
    ["processing", "ready"],
  );
});
test("replacement preserves previous ID until successful commit", async () => {
  const f = fixture({ oldVoice: "old" });
  assert.equal((await f.run({ replace: true })).status, 200);
  assert.equal(f.state.row.voice_id, "new-provider-voice");
  assert.deepEqual(f.state.updates[0], { voice_status: "processing" });
});
test("provider, malformed-response, timeout and save failures preserve old voice", async () => {
  for (const failure of [
    "providerFail",
    "invalidResponse",
    "throwProvider",
    "failSave",
    "revoke",
  ]) {
    const f = fixture({ oldVoice: "old", [failure]: true });
    const result = await f.run({ replace: true });
    assert.equal(result.status, 502);
    assert.equal(f.state.row.voice_status, "failed");
    assert.equal(f.state.row.voice_id, "old");
    assert.equal(f.state.row.voice_provider, "cartesia");
    const body = await result.text();
    assert.ok(!body.includes("test-secret") && !body.includes("diagnostics"));
  }
});
test("missing provider configuration does not alter saved state", async () => {
  const f = fixture({ missingKey: true });
  assert.equal((await f.run()).status, 503);
  assert.equal(f.state.calls, 0);
  assert.equal(f.state.updates.length, 0);
});
test("provider rejection includes actual status and redacted message in response and logs", async () => {
  for (const status of [401, 403, 422, 429, 500]) {
    const f = fixture({
      oldVoice: "old",
      providerStatus: status,
      providerBody: {
        error: {
          message: `Clone rejected test-secret ${btoa("test-secret")} SUPABASE_SERVICE_ROLE_KEY Bearer user-jwt`,
        },
        input: "private recording data",
      },
    });
    const response = await f.run({ replace: true });
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.cartesia_http_status, status);
    assert.match(body.error, /Cartesia voice clone failed: Clone rejected/);
    assert.equal(f.state.logs[0].cartesia_http_status, status);
    assert.equal(f.state.logs[0].audio_mime, "audio/wav");
    const visible = JSON.stringify([body, f.state.logs]);
    for (const secret of [
      "test-secret",
      btoa("test-secret"),
      "SUPABASE_SERVICE_ROLE_KEY",
      "user-jwt",
      "private recording data",
    ])
      assert.ok(!visible.includes(secret));
    assert.equal(f.state.row.voice_id, "old");
    assert.equal(f.state.row.voice_status, "failed");
  }
});
test("unsafe and oversized provider bodies are omitted; validation messages exclude echoed inputs", async () => {
  for (const providerBody of [
    "<html>private content</html>",
    "x".repeat(17000),
    { detail: [{ msg: "Invalid clip", input: "private content" }] },
  ]) {
    const f = fixture({ providerBody });
    const body = await (await f.run()).json();
    assert.ok(!JSON.stringify([body, f.state.logs]).includes("private content"));
    assert.ok(body.error.length < 700);
    if (typeof providerBody === "object") assert.match(body.error, /Invalid clip/);
  }
});
test("network and database failures are distinguishable from provider rejection", async () => {
  for (const [options, stage, status, message] of [
    [{ throwProvider: true }, "cartesia_request", null, /could not be reached/],
    [{ failSave: true }, "save_voice", 200, /saving its identifier failed/],
    [{ invalidResponse: true }, "cartesia_response", 200, /without a valid voice identifier/],
  ]) {
    const f = fixture(options);
    const body = await (await f.run()).json();
    assert.equal(body.cartesia_http_status, status);
    assert.match(body.error, message);
    assert.equal(f.state.logs[0].stage, stage);
  }
});
test("concurrent requests create at most one paid clone", async () => {
  const f = fixture();
  const results = await Promise.all([f.run(), f.run()]);
  assert.equal(f.state.calls, 1);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
});
test("WAV normalization produces mono PCM16 with valid sizes and clamps samples", async () => {
  const blob = encode({
    length: 3,
    sampleRate: 48000,
    numberOfChannels: 1,
    getChannelData: () => new Float32Array([-2, 0, 2]),
  });
  const bytes = await blob.arrayBuffer();
  const view = new DataView(bytes);
  assert.equal(blob.type, "audio/wav");
  assert.equal(blob.size, 50);
  assert.equal(view.getUint32(24, true), 48000);
  assert.equal(view.getUint32(40, true), 6);
  assert.deepEqual(
    [44, 46, 48].map((n) => view.getInt16(n, true)),
    [-32768, 0, 32767],
  );
});

test("recording requests permission only on start and produces a completed local WAV", async () => {
  const h = recorderHarness();
  assert.equal(h.calls, 0);
  assert.equal(h.render().audio, null);
  await h.render().start();
  assert.equal(h.calls, 1);
  assert.equal(h.render().phase, "recording");
  h.recorder.ondataavailable({ data: new Blob(["browser recording bytes"]) });
  assert.equal(h.render().audio, null);
  h.render().stop();
  await h.recorder.finished;
  assert.equal(h.render().phase, "complete");
  assert.equal(h.render().audio.type, "audio/wav");
  assert.equal(h.render().duration, 1);
  assert.ok(h.stopped > 0);
  assert.ok(h.closed > 0);
  h.render().reset();
  assert.equal(h.render().audio, null);
  assert.equal(h.render().phase, "idle");
  h.unmount();
});
test("permission denial returns to idle without a recording", async () => {
  const h = recorderHarness({ denied: true });
  await h.render().start();
  assert.match(h.render().error, /permission denied/);
  assert.equal(h.render().audio, null);
  assert.equal(h.render().phase, "idle");
  assert.ok(h.closed > 0);
  h.unmount();
});
test("unmount cancels recording and a late microphone permission grant", async () => {
  const h = recorderHarness();
  await h.render().start();
  h.unmount();
  assert.equal(h.recorder.state, "inactive");
  assert.equal(h.recorder.onstop, null);
  assert.ok(h.stopped > 0);
  const late = recorderHarness({ delayed: true });
  const starting = late.render().start();
  late.unmount();
  late.grant();
  await starting;
  assert.ok(late.stopped > 0);
  assert.ok(late.closed > 0);
  assert.equal(late.recorder, undefined);
});
