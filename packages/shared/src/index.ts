import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createDocumentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("note"),
    title: z.string().min(1).max(200),
    content: z.string().min(1),
  }),
  z.object({
    type: z.literal("faq"),
    title: z.string().min(1).max(200),
    question: z.string().min(1),
    answer: z.string().min(1),
  }),
]);

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().uuid().optional(),
});

export const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export const ticketStatusSchema = z.enum(["open", "in_progress", "resolved", "closed"]);
export const documentStatusSchema = z.enum(["pending", "processing", "ready", "failed"]);
export const messageRoleSchema = z.enum(["user", "assistant", "system"]);

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type MessageRole = z.infer<typeof messageRoleSchema>;

export interface Citation {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  score: number;
}

export interface ChatStreamEvent {
  type: "token" | "citations" | "tool" | "ticket" | "done" | "error";
  content?: string;
  citations?: Citation[];
  toolName?: string;
  ticketId?: string;
  error?: string;
}

export interface AnalyticsSummary {
  totalConversations: number;
  totalMessages: number;
  escalationRate: number;
  avgResponseTimeMs: number;
  openTickets: number;
}

export interface OrderLookupResult {
  orderNumber: string;
  status: string;
  items: string[];
  estimatedDelivery: string | null;
  total: number;
}
