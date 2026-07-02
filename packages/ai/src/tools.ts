import type { Database } from "@cx/db";
import { orders } from "@cx/db";
import type { OrderLookupResult } from "@cx/shared";
import { eq, ilike } from "drizzle-orm";

export async function lookupOrder(
  db: Database,
  orderNumber: string,
): Promise<OrderLookupResult | null> {
  const normalized = orderNumber.toUpperCase().replace(/\s+/g, "");
  const [order] = await db
    .select()
    .from(orders)
    .where(ilike(orders.orderNumber, normalized))
    .limit(1);

  if (!order) return null;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    items: order.items,
    estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
    total: order.total,
  };
}

export function extractOrderNumber(message: string): string | null {
  const match = message.match(/\bORD[-\s]?\d{3,}\b/i);
  if (!match) return null;
  const raw = match[0].toUpperCase().replace(/\s+/g, "");
  if (raw.startsWith("ORD-")) return raw;
  if (raw.startsWith("ORD")) return raw.replace(/^ORD/, "ORD-");
  return raw;
}

export async function createSupportTicket(
  db: Database,
  input: {
    sessionId?: string;
    subject: string;
    description: string;
    priority?: "low" | "medium" | "high";
  },
) {
  const { tickets } = await import("@cx/db");
  const [ticket] = await db
    .insert(tickets)
    .values({
      sessionId: input.sessionId ?? null,
      subject: input.subject,
      description: input.description,
      priority: input.priority ?? "medium",
      status: "open",
    })
    .returning();
  return ticket;
}
