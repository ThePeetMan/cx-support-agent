import { Inject, Injectable } from "@nestjs/common";
import { count, eq, sql } from "drizzle-orm";
import { chatSessions, messages, tickets, type Database } from "@cx/db";
import type { AnalyticsSummary } from "@cx/shared";
import { DATABASE } from "../database/database.module";

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async summary(): Promise<AnalyticsSummary> {
    const [[sessionCount], [messageCount], [openTicketCount], avgResponse] = await Promise.all([
      this.db.select({ value: count() }).from(chatSessions),
      this.db.select({ value: count() }).from(messages),
      this.db.select({ value: count() }).from(tickets).where(eq(tickets.status, "open")),
      this.db
        .select({ value: sql<number>`coalesce(avg(${messages.responseTimeMs}), 0)` })
        .from(messages)
        .where(eq(messages.role, "assistant")),
    ]);

    const totalConversations = sessionCount?.value ?? 0;
    const totalMessages = messageCount?.value ?? 0;
    const openTickets = openTicketCount?.value ?? 0;

    const [ticketTotal] = await this.db.select({ value: count() }).from(tickets);
    const escalationRate =
      totalConversations > 0 ? (ticketTotal?.value ?? 0) / totalConversations : 0;

    return {
      totalConversations,
      totalMessages,
      escalationRate: Math.round(escalationRate * 1000) / 1000,
      avgResponseTimeMs: Math.round(Number(avgResponse[0]?.value ?? 0)),
      openTickets,
    };
  }
}
