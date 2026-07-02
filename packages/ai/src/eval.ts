import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createDb } from "@cx/db";
import { searchKnowledgeBase } from "./retriever";

config({ path: path.resolve(__dirname, "../../../.env") });

interface EvalCase {
  question: string;
  expectedDocumentTitles: string[];
}

const K = 3;

function loadDataset(): EvalCase[] {
  const datasetPath = path.join(__dirname, "..", "eval", "dataset.json");
  return JSON.parse(readFileSync(datasetPath, "utf8")) as EvalCase[];
}

async function main() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5434/cx_support";

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-your")) {
    console.error("Set OPENAI_API_KEY in .env before running eval.");
    process.exit(1);
  }

  const db = createDb(connectionString);
  const dataset = loadDataset();
  let hits = 0;
  const misses: string[] = [];

  for (const item of dataset) {
    const results = await searchKnowledgeBase(db, item.question, K);
    const topTitles = results.slice(0, K).map((r) => r.documentTitle);
    const hit = item.expectedDocumentTitles.some((title) => topTitles.includes(title));

    if (hit) {
      hits += 1;
    } else {
      misses.push(
        `- "${item.question}" → got [${topTitles.join(", ") || "none"}], expected one of [${item.expectedDocumentTitles.join(", ")}]`,
      );
    }
  }

  const rate = (hits / dataset.length) * 100;
  console.log(`\nRAG Eval Results`);
  console.log(`================`);
  console.log(`retrieval@${K}: ${rate.toFixed(1)}% (${hits}/${dataset.length})`);

  if (misses.length > 0) {
    console.log(`\nMisses:`);
    for (const miss of misses) console.log(miss);
  }

  process.exit(rate >= 60 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
