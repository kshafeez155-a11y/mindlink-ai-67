import { createClient } from "@supabase/supabase-js";
import { getDocument } from "npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

type KnowledgeSource = {
  id: string;
  character_id: string;
  source_type: "pdf" | "document" | "text" | "url" | "youtube";
  storage_path: string | null;
  text_content: string | null;
  mime_type: string | null;
};

type ChunkInsert = {
  knowledge_source_id: string;
  character_id: string;
  chunk_index: number;
  content: string;
  token_count: null;
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLongBlock(block: string, maxCharacters: number) {
  const sentences = block.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [block];
  const pieces: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence.trim()}` : sentence.trim();
    if (current && next.length > maxCharacters) {
      pieces.push(current);
      current = sentence.trim();
    } else {
      current = next;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

function chunkText(text: string, targetCharacters = 1000, overlapCharacters = 150) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const blocks = paragraphs.flatMap((paragraph) =>
    paragraph.length > targetCharacters ? splitLongBlock(paragraph, targetCharacters) : [paragraph],
  );
  const chunks: string[] = [];
  let current = "";

  for (const block of blocks) {
    const next = current ? `${current}\n\n${block}` : block;
    if (current && next.length > targetCharacters) {
      chunks.push(current.trim());
      const overlap = current.slice(-overlapCharacters).trim();
      current = overlap ? `${overlap}\n\n${block}` : block;
    } else {
      current = next;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

async function extractPdfText(bytes: Uint8Array) {
  const pdf = await getDocument({ data: bytes, disableWorker: true, isEvalSupported: false })
    .promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return normalizeWhitespace(pages.join("\n\n"));
}

async function sourceText(source: KnowledgeSource, admin: ReturnType<typeof createClient>) {
  if (source.source_type === "text") return normalizeWhitespace(source.text_content ?? "");
  if (source.source_type === "url" || source.source_type === "youtube") {
    throw new Error("This source type is not supported for processing yet.");
  }
  if (source.source_type === "document" && source.mime_type !== "text/plain") {
    throw new Error("Only plain text documents are supported for processing right now.");
  }
  if (!source.storage_path) throw new Error("This file does not have a stored source path.");

  const { data, error } = await admin.storage
    .from("character-knowledge")
    .download(source.storage_path);
  if (error || !data) throw new Error("We couldn't download this private knowledge file.");
  const bytes = new Uint8Array(await data.arrayBuffer());
  if (source.source_type === "pdf") {
    const text = await extractPdfText(bytes);
    if (!text) throw new Error("We couldn't find readable text in this PDF.");
    return text;
  }
  return normalizeWhitespace(new TextDecoder().decode(bytes));
}

async function main(request: Request) {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST")
    return response({ error: "Only POST requests are supported." }, 405);

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return response({ error: "Knowledge processing is not configured." }, 500);
  }

  const token = authorization.replace(/^Bearer\s+/i, "");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return response({ error: "Authentication is required." }, 401);

  let payload: { knowledge_source_id?: unknown };
  try {
    payload = await request.json();
  } catch {
    return response({ error: "A knowledge_source_id is required." }, 400);
  }
  if (Object.keys(payload).length !== 1 || typeof payload.knowledge_source_id !== "string") {
    return response({ error: "A knowledge_source_id is required." }, 400);
  }
  if (!isUuid(payload.knowledge_source_id)) {
    return response({ error: "knowledge_source_id must be a valid UUID." }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: existingSource, error: existingSourceError } = await admin
    .from("knowledge_sources")
    .select("id")
    .eq("id", payload.knowledge_source_id)
    .maybeSingle();
  if (existingSourceError)
    return response({ error: "We couldn't load this knowledge source." }, 500);
  if (!existingSource) return response({ error: "Knowledge source not found." }, 404);

  const { data: source, error: sourceError } = await admin
    .from("knowledge_sources")
    .select(
      "id, character_id, source_type, storage_path, text_content, mime_type, characters!inner(creators!inner(user_id))",
    )
    .eq("id", payload.knowledge_source_id)
    .eq("characters.creators.user_id", userData.user.id)
    .maybeSingle();
  if (sourceError) return response({ error: "We couldn't verify source ownership." }, 500);
  if (!source) return response({ error: "You do not have access to this knowledge source." }, 403);

  const typedSource = source as KnowledgeSource;
  const { error: processingUpdateError } = await admin
    .from("knowledge_sources")
    .update({ processing_status: "processing", processing_error: null })
    .eq("id", typedSource.id);
  if (processingUpdateError) {
    return response({ error: "We couldn't start processing this source." }, 500);
  }

  try {
    const text = await sourceText(typedSource, admin);
    if (!text) throw new Error("We couldn't find readable text in this source.");
    const chunks = chunkText(text);
    if (chunks.length === 0) throw new Error("We couldn't find readable text in this source.");

    const { error: deleteError } = await admin
      .from("knowledge_chunks")
      .delete()
      .eq("knowledge_source_id", typedSource.id);
    if (deleteError) throw new Error("We couldn't replace the existing knowledge chunks.");

    const inserts: ChunkInsert[] = chunks.map((content, chunkIndex) => ({
      knowledge_source_id: typedSource.id,
      character_id: typedSource.character_id,
      chunk_index: chunkIndex,
      content,
      token_count: null,
    }));
    const { error: insertError } = await admin.from("knowledge_chunks").insert(inserts);
    if (insertError) throw new Error("We couldn't save the extracted knowledge chunks.");

    const { error: readyUpdateError } = await admin
      .from("knowledge_sources")
      .update({ processing_status: "ready", processing_error: null })
      .eq("id", typedSource.id);
    if (readyUpdateError) throw new Error("We couldn't mark this source as ready.");
    return response({ success: true, chunk_count: chunks.length });
  } catch (error) {
    const safeError =
      error instanceof Error ? error.message : "We couldn't process this knowledge source.";
    await admin
      .from("knowledge_sources")
      .update({ processing_status: "failed", processing_error: safeError })
      .eq("id", typedSource.id);
    console.error("Knowledge processing failed", { sourceId: typedSource.id, error });
    return response({ error: safeError }, 422);
  }
}

Deno.serve(main);
