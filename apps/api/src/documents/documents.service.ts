import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Queue } from "bullmq";
import { eq, desc } from "drizzle-orm";
import { documents, type Database } from "@cx/db";
import type { CreateDocumentInput } from "@cx/shared";
import { DATABASE } from "../database/database.module";
import { INGESTION_QUEUE } from "../queue/queue.module";
import pdf from "pdf-parse";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

@Injectable()
export class DocumentsService {
  private uploadDir = process.env.UPLOAD_DIR ?? "./uploads";

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(INGESTION_QUEUE) private readonly ingestionQueue: Queue,
  ) {}

  async list(userId: string) {
    return this.db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }

  async get(id: string, userId: string) {
    const [doc] = await this.db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);
    if (!doc || doc.userId !== userId) throw new NotFoundException("Document not found");
    return doc;
  }

  async getStatus(id: string, userId: string) {
    const doc = await this.get(id, userId);
    return { id: doc.id, status: doc.status, errorMessage: doc.errorMessage };
  }

  async createFromInput(userId: string, input: CreateDocumentInput) {
    let rawContent = "";
    let title = input.title;
    let sourceType: "note" | "faq" = "note";

    if (input.type === "note") {
      rawContent = input.content;
      sourceType = "note";
    } else {
      rawContent = `Q: ${input.question}\nA: ${input.answer}`;
      sourceType = "faq";
      title = input.title || input.question.slice(0, 80);
    }

    const [doc] = await this.db
      .insert(documents)
      .values({
        userId,
        title,
        sourceType,
        rawContent,
        status: "pending",
        charCount: rawContent.length,
      })
      .returning();

    if (!doc) throw new Error("Failed to create document");
    await this.enqueueIngestion(doc.id);
    return doc;
  }

  async uploadPdf(userId: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("File is required");
    if (file.mimetype !== "application/pdf") {
      throw new BadRequestException("Only PDF files are supported");
    }

    await mkdir(this.uploadDir, { recursive: true });
    const storageKey = `${Date.now()}-${file.originalname}`;
    const fullPath = path.join(this.uploadDir, storageKey);
    await writeFile(fullPath, file.buffer);

    const parsed = await pdf(file.buffer);
    const rawContent = parsed.text?.trim();
    if (!rawContent) throw new BadRequestException("Could not extract text from PDF");

    const [doc] = await this.db
      .insert(documents)
      .values({
        userId,
        title: file.originalname.replace(/\.pdf$/i, ""),
        sourceType: "pdf",
        storageKey,
        rawContent,
        status: "pending",
        charCount: rawContent.length,
      })
      .returning();

    if (!doc) throw new Error("Failed to create document");
    await this.enqueueIngestion(doc.id);
    return doc;
  }

  async remove(id: string, userId: string) {
    await this.get(id, userId);
    await this.db.delete(documents).where(eq(documents.id, id));
    return { ok: true };
  }

  private async enqueueIngestion(documentId: string) {
    await this.ingestionQueue.add(
      "ingest",
      { documentId },
      { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
    );
  }
}
