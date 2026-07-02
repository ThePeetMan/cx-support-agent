import { config } from "dotenv";
import { eq, inArray } from "drizzle-orm";
import path from "node:path";
import { createDb, documents } from "@cx/db";
import { ingestDocumentContent } from "./retriever";

config({ path: path.resolve(__dirname, "../../../.env") });

async function main() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5434/cx_support";

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-your")) {
    console.log("Skipping ingestion: set OPENAI_API_KEY in .env");
    process.exit(0);
  }

  const db = createDb(connectionString);
  const pending = await db
    .select()
    .from(documents)
    .where(inArray(documents.status, ["pending", "failed"]));

  if (pending.length === 0) {
    console.log("No pending documents to ingest.");
    process.exit(0);
  }

  for (const doc of pending) {
    if (!doc.rawContent) {
      console.warn(`Skipping ${doc.title}: no content`);
      continue;
    }

    await db
      .update(documents)
      .set({ status: "processing", updatedAt: new Date(), errorMessage: null })
      .where(eq(documents.id, doc.id));

    try {
      const chunkCount = await ingestDocumentContent(db, doc.id, doc.rawContent);
      await db
        .update(documents)
        .set({ status: "ready", updatedAt: new Date() })
        .where(eq(documents.id, doc.id));
      console.log(`Ingested ${doc.title}: ${chunkCount} chunks`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await db
        .update(documents)
        .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
        .where(eq(documents.id, doc.id));
      console.error(`Failed ${doc.title}:`, message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
