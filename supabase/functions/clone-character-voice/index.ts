import { createClient } from "@supabase/supabase-js";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const languages = new Set(["en", "hi", "ta", "te", "mr", "bn", "gu", "kn", "ml", "pa", "es", "fr"]);
const maxAudioBytes = 16_000_000;
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

// Never log raw responses, headers, audio, or exception objects. Redact before
// truncation so even a credential crossing the display boundary is removed.
export function safeDiagnostic(value: string, secrets: string[]) {
  let text = value;
  for (const secret of secrets.filter(Boolean)) {
    const variants = [secret, encodeURIComponent(secret)];
    try {
      variants.push(btoa(secret));
    } catch {
      /* Non-ASCII configuration is not base64-encodable. */
    }
    for (const variant of variants) {
      text = text.split(variant).join("[redacted]");
    }
  }
  return text
    .replace(/(?:sk_car_|sb_secret_)[A-Za-z0-9_-]+/gi, "[redacted]")
    .replace(/Bearer\s+[^\s"',;]+/gi, "Bearer [redacted]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?/g, "[redacted]")
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[URL omitted]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email omitted]")
    .replace(/[A-Za-z0-9+/=_-]{80,}/g, "[data omitted]")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

async function providerMessage(response: Response, secrets: string[]) {
  const reader = response.body?.getReader();
  if (!reader) return "Provider returned an empty error response.";
  const decoder = new TextDecoder();
  let text = "",
    size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_384) {
        await reader.cancel();
        return "Provider returned an oversized error response; body omitted.";
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  let message: unknown;
  try {
    const body = JSON.parse(text);
    // Extract messages only; validation errors can also contain echoed audio/input.
    message =
      typeof body === "string"
        ? body
        : (body?.error?.message ?? body?.message ?? body?.error ?? body?.detail);
    if (Array.isArray(message))
      message = message
        .map((item) => (typeof item?.msg === "string" ? item.msg : ""))
        .filter(Boolean)
        .join("; ");
  } catch {
    if (response.headers.get("content-type")?.includes("text/plain") && !text.includes("<"))
      message = text;
  }
  return typeof message === "string" && message.trim()
    ? safeDiagnostic(message, secrets)
    : "Provider returned an error without a safe readable message.";
}

// Bound actual bytes, including chunked requests, before parsing multipart data.
async function readForm(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing recording.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxAudioBytes + 64_000) {
        await reader.cancel();
        throw new Error("Recording is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new Response(bytes, {
    headers: { "Content-Type": request.headers.get("Content-Type") ?? "" },
  }).formData();
}

// Accept the canonical mono PCM WAV produced by our recorder, not arbitrary files
// renamed .wav. Cartesia still performs its own audio/voice validation.
async function validRecording(file: File) {
  if (file.type !== "audio/wav" || file.size <= 44 || file.size > maxAudioBytes) return false;
  const bytes = await file.slice(0, 44).arrayBuffer();
  const view = new DataView(bytes);
  const tag = (offset: number, size: number) =>
    new TextDecoder().decode(bytes.slice(offset, offset + size));
  const rate = view.getUint32(24, true);
  return (
    tag(0, 4) === "RIFF" &&
    tag(8, 4) === "WAVE" &&
    tag(12, 4) === "fmt " &&
    tag(36, 4) === "data" &&
    view.getUint32(4, true) === file.size - 8 &&
    view.getUint32(16, true) === 16 &&
    view.getUint16(20, true) === 1 &&
    view.getUint16(22, true) === 1 &&
    view.getUint16(34, true) === 16 &&
    rate >= 8000 &&
    rate <= 48000 &&
    view.getUint32(28, true) === rate * 2 &&
    view.getUint16(32, true) === 2 &&
    view.getUint32(40, true) === file.size - 44 &&
    (file.size - 44) % 2 === 0 &&
    (file.size - 44) / (rate * 2) <= 60
  );
}

export async function handleClone(request: Request) {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ error: "Only POST is supported." }, 405);
  const authorization = request.headers.get("Authorization");
  if (!authorization?.match(/^Bearer\s+\S+$/i))
    return json({ error: "Authentication is required." }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !serviceKey) return json({ error: "Voice setup is not configured." }, 503);
  const userClient = createClient(url, anon, { auth: { persistSession: false } });
  const { data: auth, error: authError } = await userClient.auth.getUser(
    authorization.replace(/^Bearer\s+/i, ""),
  );
  if (authError || !auth.user) return json({ error: "Authentication is required." }, 401);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("account_type")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (profileError) return json({ error: "We couldn't verify your account." }, 503);
  if (profile?.account_type !== "creator")
    return json({ error: "Only creators can set up voices." }, 403);
  let form: FormData;
  try {
    form = await readForm(request);
  } catch {
    return json({ error: "Send a valid recording smaller than 16 MB." }, 400);
  }
  const characterId = form.get("character_id");
  const clip = form.get("audio");
  const language = form.get("language");
  if (
    typeof characterId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(characterId)
  ) {
    return json({ error: "A valid character ID is required." }, 400);
  }
  const { data: character, error: characterError } = await admin
    .from("characters")
    .select("id, creator_id, name, voice_id, voice_provider, voice_status, creators!inner(user_id)")
    .eq("id", characterId)
    .eq("creators.user_id", auth.user.id)
    .maybeSingle();
  if (characterError) return json({ error: "We couldn't verify character ownership." }, 503);
  if (!character) return json({ error: "You do not own this character." }, 403);
  if (form.get("consent") !== "true")
    return json({ error: "Your explicit voice-cloning consent is required." }, 400);
  if (
    !(clip instanceof File) ||
    !(await validRecording(clip)) ||
    typeof language !== "string" ||
    !languages.has(language)
  ) {
    return json(
      { error: "Send a completed WAV recording up to 60 seconds long and choose its language." },
      400,
    );
  }
  if (character.voice_id && form.get("replace") !== "true")
    return json({ error: "Confirm replacement and record a new sample first." }, 409);
  if (character.voice_status === "processing")
    return json({ error: "Voice setup is already processing.", voice_status: "processing" }, 409);
  if (!["not_setup", "ready", "failed"].includes(character.voice_status))
    return json({ error: "Voice status is unavailable." }, 409);
  const apiKey = Deno.env.get("CARTESIA_API_KEY")?.trim();
  if (!apiKey) {
    console.error("clone-character-voice configuration failure", {
      stage: "configuration",
      cartesia_key_configured: false,
    });
    return json({ error: "Voice cloning is not configured: CARTESIA_API_KEY is missing." }, 503);
  }
  const secrets = [
    apiKey,
    serviceKey,
    anon,
    authorization,
    authorization.replace(/^Bearer\s+/i, ""),
  ];

  // Compare-and-set prevents two requests from creating paid clones concurrently.
  let claim = admin
    .from("characters")
    .update({ voice_status: "processing" })
    .eq("id", characterId)
    .eq("creator_id", character.creator_id)
    .eq("voice_status", character.voice_status);
  claim =
    character.voice_id === null
      ? claim.is("voice_id", null)
      : claim.eq("voice_id", character.voice_id);
  const { data: claimed, error: claimError } = await claim.select("id").maybeSingle();
  if (claimError) return json({ error: "We couldn't start voice setup." }, 503);
  if (!claimed) return json({ error: "Voice setup changed. Refresh before trying again." }, 409);
  let stage = "cartesia_request";
  let providerStatus: number | null = null;
  let diagnostic = "Cartesia could not be reached or the request timed out.";
  const started = Date.now();
  try {
    const body = new FormData();
    body.append("clip", clip, "creator-voice.wav");
    body.append("name", character.name?.trim().slice(0, 120) || "MindLink character");
    body.append("language", language);
    body.append("access", "private");
    const result = await fetch("https://api.cartesia.ai/voices/clone", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Cartesia-Version": "2026-08-14" },
      body,
      signal: AbortSignal.timeout(90_000),
    });
    providerStatus = result.status;
    stage = "cartesia_response";
    if (!result.ok) {
      diagnostic = "Cartesia voice clone failed: unable to read the provider error response.";
      diagnostic = `Cartesia voice clone failed: ${await providerMessage(result, secrets)}`;
      throw new Error("Cartesia request failed.");
    }
    diagnostic = "Cartesia returned an invalid JSON response.";
    const payload = await result.json();
    if (typeof payload?.id !== "string" || !payload.id.trim() || payload.id.length > 256) {
      diagnostic = "Cartesia returned success without a valid voice identifier.";
      throw new Error("Invalid provider identifier.");
    }
    // Recheck role and ownership before committing the provider result.
    stage = "ownership_recheck";
    diagnostic = "Voice was created, but character ownership could not be reverified.";
    const { data: owner, error: ownerError } = await admin
      .from("creators")
      .select("id")
      .eq("id", character.creator_id)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    const { data: currentProfile, error: currentProfileError } = await admin
      .from("profiles")
      .select("account_type")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (ownerError || !owner || currentProfileError || currentProfile?.account_type !== "creator")
      throw new Error("Ownership changed.");
    stage = "save_voice";
    diagnostic = "Cartesia created the voice, but saving its identifier failed.";
    const { data: saved, error: saveError } = await admin
      .from("characters")
      .update({ voice_provider: "cartesia", voice_id: payload.id, voice_status: "ready" })
      .eq("id", characterId)
      .eq("creator_id", character.creator_id)
      .eq("voice_status", "processing")
      .select("id")
      .maybeSingle();
    if (saveError || !saved) {
      if (saveError) diagnostic += ` Database: ${safeDiagnostic(saveError.message, secrets)}`;
      throw new Error("Could not save clone.");
    }
    return json({ success: true, voice_status: "ready" });
  } catch {
    diagnostic = safeDiagnostic(diagnostic, secrets);
    console.error("clone-character-voice failed", {
      stage,
      character_id: characterId,
      cartesia_http_status: providerStatus,
      message: diagnostic,
      elapsed_ms: Date.now() - started,
      audio_mime: clip.type,
      audio_bytes: clip.size,
      language,
      cartesia_version: "2026-08-14",
      replacing_existing_voice: Boolean(character.voice_id),
    });
    // Preserve any previous provider and voice ID, including on replacement failure.
    const { data: failed, error: failureError } = await admin
      .from("characters")
      .update({ voice_status: "failed" })
      .eq("id", characterId)
      .eq("creator_id", character.creator_id)
      .eq("voice_status", "processing")
      .select("id")
      .maybeSingle();
    if (failureError || !failed) {
      console.error("clone-character-voice failure status update failed", {
        character_id: characterId,
        message: failureError
          ? safeDiagnostic(failureError.message, secrets)
          : "Character no longer matched processing state.",
      });
      return json(
        {
          success: false,
          cartesia_http_status: providerStatus,
          error: `${diagnostic} The failure status could not be saved. Refresh before retrying.`,
        },
        503,
      );
    }
    return json(
      {
        success: false,
        voice_status: "failed",
        cartesia_http_status: providerStatus,
        error: diagnostic,
      },
      502,
    );
  }
}

Deno.serve(async (request) => {
  try {
    return await handleClone(request);
  } catch {
    return json(
      {
        success: false,
        error: "Voice setup is temporarily unavailable. Please refresh and try again.",
      },
      503,
    );
  }
});
