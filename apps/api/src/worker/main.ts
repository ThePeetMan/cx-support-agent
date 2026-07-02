import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { createDb, documents } from "@cx/db";
import { ingestDocumentContent } from "@cx/ai";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6381";

const db = createDb(
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5434/cx_support",
);

async function processIngestion(documentId: string) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!doc) throw new Error(`Document not found: ${documentId}`);

  await db
    .update(documents)
    .set({ status: "processing", updatedAt: new Date() })
    .where(eq(documents.id, documentId));

  try {
    const content = doc.rawContent;
    if (!content) throw new Error("Document has no content");

    const chunkCount = await ingestDocumentContent(db, documentId, content);
    await db
      .update(documents)
      .set({
        status: "ready",
        charCount: content.length,
        updatedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(documents.id, documentId));

    console.log(`Ingested document ${documentId}: ${chunkCount} chunks`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion error";
    await db
      .update(documents)
      .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
      .where(eq(documents.id, documentId));
    throw error;
  }
}

const worker = new Worker(
  "document-ingestion",
  async (job) => {
    if (job.name === "ingest") {
      await processIngestion(job.data.documentId as string);
    }
  },
  { connection: { url: redisUrl, maxRetriesPerRequest: null } },
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed`, err));

console.log("Document ingestion worker started");
