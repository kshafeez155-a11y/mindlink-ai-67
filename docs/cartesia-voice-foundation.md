# Cartesia voice cloning MVP

## Implemented

The onboarding Voice step reads real state and records with native MediaRecorder.
Consent and a saved UUID are required. Creator role is checked in the UI and again
server-side. Microphone permission is requested only on Start recording. Stopping
produces a local preview; Record again discards it. Create my voice explicitly
uploads the completed recording. Leaving the step stops capture and frees local
resources. A submitted server request may finish after navigation; returning to
Voice reloads the saved state.

MediaRecorder uses WebM/Opus, Ogg/Opus, or MP4 depending on browser support. Web Audio
decodes the completed clip; it is normalized to mono PCM16 WAV, capped at 60 seconds
and 16 MB. These are upper limits, not a required recording length. Select the
language spoken in the recording. No Supabase Storage bucket is used for samples.

## Edge Function

`supabase/functions/clone-character-voice/index.ts` accepts multipart form data:
`character_id`, `audio` (WAV), `consent=true`, `language`, and `replace=true` for a
character with an existing voice. It authenticates the JWT through auth.getUser,
checks profiles.account_type = creator, and verifies the character through
characters.creator_id -> creators.user_id. Audience/non-owner requests return 403.
No client-supplied creator ID or provider voice ID is trusted.

The function atomically claims the existing voice status as processing. Concurrent
requests return 409 without calling the provider. It calls POST
https://api.cartesia.ai/voices/clone using Authorization: Bearer CARTESIA_API_KEY,
Cartesia-Version: 2026-08-14, and multipart clip/name/language/access=private. The
character name supplies the clone name. FormData supplies the multipart boundary.
Only a validated response ID is persisted. Responses omit provider metadata/secrets.

Success sets provider=cartesia, voice_id, and status=ready. Provider or persistence
failure sets failed without changing the old provider/ID. Configuration/validation
failures before claiming processing leave stored metadata unchanged. Replacement
requires explicit Replace voice, fresh consent, and a new recording. The old voice
is not deleted, and its identifier changes only after success. The frontend never
writes voice metadata; it reloads status after either outcome and polls processing.

## Deploy and secrets

No deployment or live paid clone was performed in this workspace. Using your
existing authenticated Supabase CLI/project setup:

- Configure CARTESIA_API_KEY in Supabase Edge Function secrets (dashboard, or
  `supabase secrets set --env-file <private-env-file>`). Never use a VITE variable.
- Deploy with `supabase functions deploy clone-character-voice`.
- Verify the deployed JWT gateway settings accept your project's authenticated
  user tokens; the function independently verifies every token.
- Test Creator success, Audience/non-owner rejection, initial failure and
  replacement failure with a real consenting creator and supported browser.

No existing RLS/schema, publishing, chat backend, or playback behavior was changed.
The existing characters voice columns and constraints are prerequisites.

## Validation

Run `node tests/clone-character-voice.test.cjs` for mocked backend tests and WAV
encoding checks. It uses the existing TypeScript dev dependency and Node's test
runner, with no added packages. App build/type-check are separate; the app's
TypeScript configuration excludes Deno Edge Functions. Deno is not installed here.
Tests make no external provider requests and do not prove live provider success.

## Remaining limits before wider rollout

- Consent is explicitly required per request but is not stored as a durable audit
  record; no consent-table/schema change was authorized.
- The Edge Function controls its writes, but live database column grants and
  direct REST-write protections for voice fields have not been inspected. Existing
  RLS is unchanged; audit those protections separately before wider rollout.
- The per-character processing claim prevents overlapping clones, not repeated
  sequential paid requests. Account quotas/rate limits remain future work.
- A platform termination can leave processing stuck. Refresh exposes real state;
  it never invents failed/ready or automatically steals a processing claim. An
  operational recovery/job mechanism is needed for that rare case.
- A provider success followed by a database failure can leave an unused private
  Cartesia clone. Old/replaced voices are also retained. Provider reconciliation
  and retention cleanup are not implemented by this MVP.
- Native recording, permission UI, and playback of the local sample require
  real-device testing over HTTPS. No raw sample is persisted in MindLink storage;
  Cartesia retention is governed by the provider account/configuration.

## Future web-call TTS (not implemented)

Keep /voice/:id recognition -> chat-character -> conversation_id -> AI answer.
Later, generate-character-speech should authenticate the caller, resolve a
published character's ready voice ID server-side, synthesize the verified answer,
and return audio. Browser synthesis remains today's playback. A future audio
adapter must preserve End Call cancellation, replay, text fallback, and autoplay
recovery without changing chat/RAG/conversation persistence.

## Provider references

- https://docs.cartesia.ai/api-reference/voices/clone
- https://docs.cartesia.ai/build-with-cartesia/capability-guides/clone-voices

API and upload requirements checked 2026-09-11.
