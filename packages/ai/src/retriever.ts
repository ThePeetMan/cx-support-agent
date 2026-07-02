import type { Database } from "@cx/db";
import type { Citation } from "@cx/shared";
import { sql, eq } from "drizzle-orm";
import { chunks } from "@cx/db";
import { getOpenAIClient } from "./openai";

export async function embedText(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  const embedding = response.data[0]?.embedding;
  if (!embedding) throw new Error("Failed to generate embedding");
  return embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return response.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export async function searchKnowledgeBase(
  db: Database,
  query: string,
  limit = 8,
): Promise<Citation[]> {
  const embedding = await embedText(query);
  const vectorExpr = sql.raw(`'[${embedding.join(",")}]'::vector`);

  const rows = await db.execute<{
    chunk_id: string;
    document_id: string;
    document_title: string;
    content: string;
    score: number;
  }>(sql`
    SELECT
      c.id AS chunk_id,
      c.document_id,
      d.title AS document_title,
      c.content,
      1 - (c.embedding <=> ${vectorExpr}) AS score
    FROM chunks c
    INNER JOIN documents d ON d.id = c.document_id
    WHERE d.status = 'ready'
    ORDER BY c.embedding <=> ${vectorExpr}
    LIMIT ${limit}
  `);

  return rows.map((row) => ({
    chunkId: row.chunk_id,
    documentId: row.document_id,
    documentTitle: row.document_title,
    content: row.content,
    score: Number(row.score),
  }));
}

export function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const chunksOut: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length <= chunkSize) {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    } else {
      if (current) chunksOut.push(current);
      if (paragraph.length <= chunkSize) {
        current = paragraph;
      } else {
        for (let i = 0; i < paragraph.length; i += chunkSize - overlap) {
          chunksOut.push(paragraph.slice(i, i + chunkSize));
        }
        current = "";
      }
    }
  }
  if (current) chunksOut.push(current);
  return chunksOut.length > 0 ? chunksOut : [text.slice(0, chunkSize)];
}

export async function ingestDocumentContent(
  db: Database,
  documentId: string,
  content: string,
): Promise<number> {
  const pieces = chunkText(content);
  const embeddings = await embedBatch(pieces);

  await db.delete(chunks).where(eq(chunks.documentId, documentId));

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const embedding = embeddings[i];
    if (!piece || !embedding) continue;

    await db.insert(chunks).values({
      documentId,
      ordinal: i,
      content: piece,
      embedding: sql.raw(`'[${embedding.join(",")}]'::vector`),
      tokenCount: Math.ceil(piece.length / 4),
    });
  }

  return pieces.length;
}
