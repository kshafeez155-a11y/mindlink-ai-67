import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

const EMBEDDING_DIMENSIONS = 768;
const DEFAULT_MATCH_COUNT = 5;
const MAX_MATCH_COUNT = 10;

type SearchPayload = {
  question?: unknown;
  character_id?: unknown;
  match_count?: unknown;
};

type MatchRow = {
  id: string;
  knowledge_source_id: string;
  character_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
};

class SearchError extends Error {
  technicalMessage: string;

  constructor(message: string, technicalMessage = message) {
    super(message);
    this.name = "SearchError";
    this.technicalMessage = technicalMessage;
  }
}

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function generateQuestionEmbedding(question: string, apiKey: string) {
  let embeddingResponse: Response;
  try {
    embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text: question }] },
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
      },
    );
  } catch (error) {
    const technicalMessage = error instanceof Error ? error.message : String(error);
    throw new SearchError(
      "We couldn't search this character's knowledge right now.",
      `Gemini embedding request failed: ${technicalMessage}`,
    );
  }

  const payload = (await embeddingResponse.json().catch(() => null)) as {
    embedding?: { values?: unknown };
    error?: { message?: string };
  } | null;

  if (!embeddingResponse.ok) {
    const providerMessage = payload?.error?.message ?? `HTTP ${embeddingResponse.status}`;
    throw new SearchError(
      "We couldn't search this character's knowledge right now.",
      `Gemini embedding request failed: ${providerMessage}`,
    );
  }

  const values = payload?.embedding?.values;
  if (
    !Array.isArray(values) ||
    values.length !== EMBEDDING_DIMENSIONS ||
    values.some((value) => typeof value !== "number" || !Number.isFinite(value))
  ) {
    throw new SearchError(
      "We couldn't search this character's knowledge right now.",
      "Gemini returned an invalid question embedding.",
    );
  }

  return values as number[];
}

async function main(request: Request) {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return response({ error: "Only POST requests are supported." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!authorization || !supabaseUrl || !anonKey || !geminiApiKey) {
    return response({ error: "Knowledge search is not configured." }, 500);
  }

  const token = authorization.replace(/^Bearer\s+/i, "");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return response({ error: "Authentication is required." }, 401);

  let payload: SearchPayload;
  try {
    payload = await request.json();
  } catch {
    return response({ error: "A question and character_id are required." }, 400);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return response({ error: "A question and character_id are required." }, 400);
  }

  const question = typeof payload.question === "string" ? payload.question.trim() : "";
  if (!question) return response({ error: "Question must not be empty." }, 400);
  if (question.length > 4000) return response({ error: "Question is too long." }, 400);

  if (typeof payload.character_id !== "string" || !isUuid(payload.character_id)) {
    return response({ error: "character_id must be a valid UUID." }, 400);
  }

  const matchCount = payload.match_count ?? DEFAULT_MATCH_COUNT;
  if (
    typeof matchCount !== "number" ||
    !Number.isInteger(matchCount) ||
    matchCount < 1 ||
    matchCount > MAX_MATCH_COUNT
  ) {
    return response({ error: "match_count must be an integer between 1 and 10." }, 400);
  }

  try {
    const questionEmbedding = await generateQuestionEmbedding(question, geminiApiKey);
    const { data, error } = await userClient.rpc("match_knowledge_chunks", {
      query_embedding: questionEmbedding,
      match_character_id: payload.character_id,
      match_count: matchCount,
    });

    if (error) {
      throw new SearchError(
        "We couldn't search this character's knowledge right now.",
        `Knowledge search RPC failed: ${error.message}`,
      );
    }

    const matches = (Array.isArray(data) ? data : []) as Partial<MatchRow>[];
    const results = matches.map((match) => ({
      id: match.id,
      knowledge_source_id: match.knowledge_source_id,
      character_id: match.character_id,
      chunk_index: match.chunk_index,
      content: match.content,
      similarity: match.similarity,
    }));

    return response({ results });
  } catch (error) {
    const safeError =
      error instanceof SearchError
        ? error.message
        : "We couldn't search this character's knowledge right now.";
    const technicalError = error instanceof SearchError ? error.technicalMessage : error;
    console.error("Knowledge search failed", {
      characterId: payload.character_id,
      error: technicalError,
    });
    return response({ error: safeError }, 422);
  }
}

Deno.serve(main);
