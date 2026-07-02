import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { tickets, type Database } from "@cx/db";
import { DATABASE } from "../database/database.module";

@Injectable()
export class TicketsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  list() {
    return this.db.select().from(tickets).orderBy(desc(tickets.createdAt)).limit(100);
  }

  async get(id: string) {
    const [ticket] = await this.db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  async update(id: string, body: { status?: string; priority?: string }) {
    await this.get(id);
    const [updated] = await this.db
      .update(tickets)
      .set({
        status: body.status as typeof tickets.$inferInsert.status,
        priority: body.priority as typeof tickets.$inferInsert.priority,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();
    return updated;
  }
}
