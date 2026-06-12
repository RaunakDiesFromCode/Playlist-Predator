/**
 * RAG Implementation Plan & Future Code
 *
 * This file contains the implementation plan and placeholder code for
 * Retrieval Augmented Generation (RAG) support in PredAI.
 *
 * STATUS: Architecture designed, not yet wired into the chat flow.
 *         Implement Phase 1 first, then Phase 2.
 */

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: Schema + Ingestion
// ═══════════════════════════════════════════════════════════════════════════

/**
 * New Supabase table for transcript chunks with vector embeddings.
 *
 * Run this SQL in your Supabase SQL editor:
 *
 * ```sql
 * -- Enable pgvector extension
 * create extension if not exists vector;
 *
 * -- Transcript chunks table
 * create table if not exists transcript_chunks (
 *     id uuid primary key default gen_random_uuid(),
 *     video_id text not null,
 *     video_title text not null,
 *     video_position int not null,
 *     start_time float not null,  -- seconds
 *   end_time float not null,    -- seconds
 *     content text not null,
 *     embedding vector(1536),    -- OpenAI text-embedding-3-small dimension
 *     created_at timestamptz default now()
 * );
 *
 * -- Index for fast similarity search
 * create index on transcript_chunks
 *     using ivfflat (embedding vector_cosine_ops)
 *     with (lists = 100);
 *
 * -- Function for similarity search
 * create or replace function match_transcript_chunks(
 *     query_embedding vector(1536),
 *     match_threshold float default 0.7,
 *     match_count int default 5
 * )
 * returns table (
 *     id uuid,
 *     video_id text,
 *     video_title text,
 *     video_position int,
 *     start_time float,
 *     end_time float,
 *     content text,
 *     similarity float
 * )
 * language sql stable
 * as $$
 *     select
 *         tc.id,
 *         tc.video_id,
 *         tc.video_title,
 *         tc.video_position,
 *         tc.start_time,
 *         tc.end_time,
 *         tc.content,
 *         1 - (tc.embedding <=> query_embedding) as similarity
 *     from transcript_chunks tc
 *     where 1 - (tc.embedding <=> query_embedding) > match_threshold
 *     order by tc.embedding <=> query_embedding
 *     limit match_count;
 * $$;
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: Embedding + Retrieval Pipeline
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CHUNKING STRATEGY
 *
 * Option A: Time-based chunks (recommended for video transcripts)
 *   - Split transcript into 30-60 second segments
 *   - Each chunk covers ~1-2 sentences of speech
 *   - Pros: Simple, predictable size, aligns with video timestamps
 *
 * Option B: Semantic chunks
 *   - Use LLM to identify topic boundaries
 *   - Split at natural breaks in content
 *   - Pros: Better semantic coherence
 *   - Cons: Expensive, slower
 *
 * Option C: Hybrid (best quality)
 *   - First split by time (60s windows, 15s overlap)
 *   - Then merge adjacent chunks if they share the same topic
 *
 * Recommended: Start with Option A, migrate to C later.
 */

/**
 * EMBEDDING MODEL RECOMMENDATIONS
 *
 * | Model                      | Dimension | Cost (per 1M tokens) | Quality |
 * |----------------------------|-----------|----------------------|---------|
 * | text-embedding-3-small     | 1536      | $0.02                | Good    |
 * | text-embedding-3-large     | 3072      | $0.13                | Best    |
 * | text-embedding-ada-002     | 1536      | $0.10                | Good    |
 *
 * Recommendation: text-embedding-3-small (best cost/quality ratio)
 * 1536 dimensions is sufficient for transcript retrieval.
 */

// ── Placeholder: Embedding function ────────────────────────────────────────

/**
 * Generate an embedding for a text chunk using OpenAI.
 *
 * In production, you might use:
 * - OpenAI text-embedding-3-small (recommended)
 * - Cohere embed-v3
 * - Voyage AI voyage-2
 * - Or self-host with sentence-transformers
 */
export async function generateEmbedding(): Promise<number[]> {
    // Placeholder — implement with your chosen provider
    // const response = await fetch("https://api.openai.com/v1/embeddings", {
    //     method: "POST",
    //     headers: {
    //         Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    //         "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //         model: "text-embedding-3-small",
    //         input: text,
    //     }),
    // });
    // const data = await response.json();
    // return data.data[0].embedding;
    throw new Error("Not implemented — see rag.ts for setup instructions");
}

// ── Placeholder: Chunk ingestion ───────────────────────────────────────────

/**
 * Ingest a video transcript and store chunks with embeddings.
 *
 * Call this when:
 * 1. A user first opens a playlist (lazy ingestion)
 * 2. A new video is added to a playlist
 * 3. On-demand when user asks about specific content
 */
export async function ingestTranscript(): Promise<void> {
    // 1. Fetch transcript (YouTube Data API doesn't provide transcripts directly)
    //    Options:
    //    - youtube-transcript npm package (free, unofficial)
    //    - YouTube Data API v3 captions (requires owner consent)
    //    - Whisper API for auto-transcription
    //
    // 2. Chunk the transcript into 60-second windows with 15s overlap
    //
    // 3. Generate embeddings for each chunk
    //
    // 4. Insert into transcript_chunks table
    //
    // Example:
    // const chunks = chunkTranscript(transcript, { windowSeconds: 60, overlapSeconds: 15 });
    // for (const chunk of chunks) {
    //     const embedding = await generateEmbedding(chunk.text);
    //     await supabase.from("transcript_chunks").insert({
    //         video_id: videoId,
    //         video_title: videoTitle,
    //         video_position: videoPosition,
    //         start_time: chunk.startTime,
    //         end_time: chunk.endTime,
    //         content: chunk.text,
    //         embedding,
    //     });
    // }
    throw new Error("Not implemented — see rag.ts for setup instructions");
}

// ── Placeholder: Retrieval function ─────────────────────────────────────────

/**
 * Retrieve relevant transcript chunks for a user query.
 *
 * This is the core RAG retrieval function. It:
 * 1. Embeds the user query
 * 2. Searches for similar chunks using pgvector
 * 3. Returns the top-k most relevant chunks
 */
export async function retrieveRelevantChunks(): Promise<
    Array<{
        id: string;
        videoId: string;
        videoTitle: string;
        videoPosition: number;
        startTime: number;
        endTime: number;
        content: string;
        similarity: number;
    }>
> {
    // 1. Generate embedding for the query
    // const queryEmbedding = await generateEmbedding(query);
    //
    // 2. Search using the match_transcript_chunks function
    // const { data, error } = await supabase.rpc("match_transcript_chunks", {
    //     query_embedding: queryEmbedding,
    //     match_threshold: options?.threshold ?? 0.7,
    //     match_count: options?.maxResults ?? 5,
    // });
    //
    // 3. Optionally filter by video ID
    // if (options?.videoId) {
    //     data = data.filter((c: any) => c.video_id === options.videoId);
    // }
    //
    // return data;
    throw new Error("Not implemented — see rag.ts for setup instructions");
}

// ── Placeholder: Serialize for system prompt ────────────────────────────────

/**
 * Serialize retrieved chunks into a system-prompt-friendly string.
 */
export function serializeRAGResults(
    chunks: Array<{
        videoTitle: string;
        videoPosition: number;
        startTime: number;
        endTime: number;
        content: string;
        similarity: number;
    }>,
): string {
    if (chunks.length === 0) return "";

    const lines = ["## Relevant Transcript Excerpts:\n"];

    for (const chunk of chunks) {
        const startMin = Math.floor(chunk.startTime / 60);
        const startSec = Math.floor(chunk.startTime % 60);
        const timestamp = `${startMin}:${startSec.toString().padStart(2, "0")}`;

        lines.push(
            `### ${chunk.videoTitle} (Video ${chunk.videoPosition}) @ ${timestamp}`,
        );
        lines.push(chunk.content);
        lines.push("");
    }

    return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3: Integration with Chat Flow
// ═══════════════════════════════════════════════════════════════════════════

/**
 * To wire RAG into the chat flow, modify the API route (`src/app/api/predai/route.ts`):
 *
 * 1. After building the context, check if the user's question is content-specific:
 *    - "Explain backpropagation" → content query
 *    - "Where was X discussed?" → content query
 *    - "What should I study next?" → NOT a content query (use context builder only)
 *
 * 2. If it's a content query:
 *    - Call retrieveRelevantChunks(userMessage)
 *    - If results found, append serializeRAGResults() to the system prompt
 *    - Include video timestamps so the user can jump to the relevant part
 *
 * 3. If no results found:
 *    - Fall back to model knowledge
 *    - Optionally suggest: "This topic wasn't found in the transcripts,
 *      but here's what I know..."
 *
 * Example integration in route.ts:
 *
 * ```
 * const isContentQuery = /\b(explain|where|discussed|mentioned|what does|how does|define)\b/.test(lastUserMessage);
 * let ragStr = "";
 * if (isContentQuery) {
 *     const chunks = await retrieveRelevantChunks(lastUserMessage);
 *     ragStr = serializeRAGResults(chunks);
 * }
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: Transcript Fetching
// ═══════════════════════════════════════════════════════════════════════════

/**
 * TRANSCRIPT FETCHING OPTIONS
 *
 * 1. youtube-transcript (npm package)
 *    - Free, unofficial, uses YouTube's internal API
 *    - Pros: No API key needed, works for most videos
 *    - Cons: Unofficial, may break if YouTube changes their API
 *    - npm install youtube-transcript
 *
 * 2. YouTube Data API v3 - Captions
 *    - Official, requires OAuth2 with YouTube account
 *    - Pros: Official, reliable
 *    - Cons: Only works for videos you own or that have captions enabled
 *
 * 3. Whisper API (OpenAI)
 *    - Transcribe audio using AI
 *    - Pros: Works for any video, no captions needed
 *    - Cons: Costs money, slower, requires downloading audio
 *
 * 4. AssemblyAI / Deepgram
 *    - Professional transcription APIs
 *    - Pros: High accuracy, speaker diarization
 *    - Cons: Costs money
 *
 * Recommendation: Start with youtube-transcript for cost efficiency.
 * Fall back to Whisper for videos without captions.
 */
