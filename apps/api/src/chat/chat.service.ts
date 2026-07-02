import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { chatSessions, messages, type Database } from "@cx/db";
import type { ChatMessageInput, ChatStreamEvent } from "@cx/shared";
import { streamSupportAgent } from "@cx/ai";
import type Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { DATABASE } from "../database/database.module";
import { REDIS } from "../redis/redis.module";

@Injectable()
export class ChatService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async createSession(userAgent?: string) {
    const visitorId = uuidv4();
    const [session] = await this.db
      .insert(chatSessions)
      .values({ visitorId, userAgent: userAgent ?? null })
      .returning();
    if (!session) throw new Error("Failed to create session");
    await this.redis.setex(`session:${session.id}`, 60 * 60 * 24 * 7, visitorId);
    return { sessionId: session.id, visitorId };
  }

  async *streamMessage(input: ChatMessageInput, userAgent?: string) {
    let sessionId = input.sessionId;
    if (!sessionId) {
      const created = await this.createSession(userAgent);
      sessionId = created.sessionId;
      yield { type: "token", content: "" } satisfies ChatStreamEvent;
    }

    const session = await this.db.query.chatSessions.findFirst({
      where: eq(chatSessions.id, sessionId),
    });
    if (!session) throw new NotFoundException("Session not found");

    await this.db.insert(messages).values({
      sessionId,
      role: "user",
      content: input.message,
    });

    const historyRows = await this.db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.createdAt);

    const history = historyRows
      .filter((m) => m.role !== "system")
      .slice(-10)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const startedAt = Date.now();
    let fullAnswer = "";
    let citations: unknown[] = [];

    for await (const event of streamSupportAgent(
      {
        db: this.db,
        sessionId,
        history: history
          .filter((h) => h.role === "user" || h.role === "assistant")
          .slice(0, -1),
      },
      input.message,
    )) {
      if (event.type === "token" && event.content) fullAnswer += event.content;
      if (event.type === "citations") citations = event.citations ?? [];
      yield event;
    }

    await this.db.insert(messages).values({
      sessionId,
      role: "assistant",
      content: fullAnswer,
      citations,
      responseTimeMs: Date.now() - startedAt,
    });

    await this.db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));
  }

  async listSessions() {
    return this.db.select().from(chatSessions).orderBy(desc(chatSessions.updatedAt)).limit(100);
  }

  async getSession(id: string) {
    const [session] = await this.db.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1);
    if (!session) throw new NotFoundException("Session not found");
    const sessionMessages = await this.db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, id))
      .orderBy(messages.createdAt);
    return { ...session, messages: sessionMessages };
  }

  async takeover(id: string) {
    const [session] = await this.db
      .update(chatSessions)
      .set({ humanTakeover: true, updatedAt: new Date() })
      .where(eq(chatSessions.id, id))
      .returning();
    if (!session) throw new NotFoundException("Session not found");
    return session;
  }
}
