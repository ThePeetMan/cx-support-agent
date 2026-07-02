import type { Database } from "@cx/db";
import type { Citation, ChatStreamEvent } from "@cx/shared";
import type OpenAI from "openai";
import { CONFIDENCE_THRESHOLD, CLASSIFY_PROMPT, SYSTEM_PROMPT } from "./prompts";
import { searchKnowledgeBase } from "./retriever";
import { getOpenAIClient } from "./openai";
import { createSupportTicket, extractOrderNumber, lookupOrder } from "./tools";

export type AgentIntent = "question" | "order" | "human" | "other";

export interface AgentContext {
  db: Database;
  sessionId: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AgentResult {
  answer: string;
  citations: Citation[];
  intent: AgentIntent;
  confidence: number;
  toolUsed?: string;
  ticketId?: string;
  responseTimeMs: number;
}

async function classifyIntent(message: string): Promise<AgentIntent> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: CLASSIFY_PROMPT },
      { role: "user", content: message },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim().toLowerCase() ?? "question";
  if (raw.includes("order")) return "order";
  if (raw.includes("human")) return "human";
  if (raw.includes("other")) return "other";
  return "question";
}

function estimateConfidence(citations: Citation[], answer: string): number {
  const topScore = citations[0]?.score ?? 0;
  const hedging = /not sure|cannot find|human agent|escalat/i.test(answer);
  if (hedging) return Math.min(topScore, 0.5);
  return topScore;
}

async function generateAnswer(
  message: string,
  citations: Citation[],
  history: AgentContext["history"],
  extraContext?: string,
): Promise<string> {
  const contextBlock =
    citations.length > 0
      ? citations.map((c, i) => `[${i + 1}] (${c.documentTitle})\n${c.content}`).join("\n\n")
      : "No knowledge base context found.";

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\nKnowledge base:\n${contextBlock}${extraContext ? `\n\nAdditional context:\n${extraContext}` : ""}`,
    },
    ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages,
  });

  return response.choices[0]?.message?.content?.trim() ?? "I'm sorry, I couldn't generate a response.";
}

export async function runSupportAgent(
  ctx: AgentContext,
  message: string,
): Promise<AgentResult> {
  const started = Date.now();
  const intent = await classifyIntent(message);
  let citations: Citation[] = [];
  let toolUsed: string | undefined;
  let ticketId: string | undefined;
  let extraContext: string | undefined;

  if (intent === "human") {
    const ticket = await createSupportTicket(ctx.db, {
      sessionId: ctx.sessionId,
      subject: "Customer requested human agent",
      description: message,
      priority: "high",
    });
    ticketId = ticket?.id;
    toolUsed = "create_ticket";
    return {
      answer:
        "I've created a support ticket and notified our team. A human agent will follow up shortly. Your ticket reference is included in this conversation.",
      citations: [],
      intent,
      confidence: 1,
      toolUsed,
      ticketId,
      responseTimeMs: Date.now() - started,
    };
  }

  if (intent === "order" || extractOrderNumber(message)) {
    const orderNumber = extractOrderNumber(message) ?? message;
    const order = await lookupOrder(ctx.db, orderNumber);
    toolUsed = "lookup_order";
    if (order) {
      extraContext = `Order ${order.orderNumber}: status=${order.status}, items=${order.items.join(", ")}, total=$${order.total.toFixed(2)}, estimated delivery=${order.estimatedDelivery ?? "N/A"}`;
    } else {
      extraContext = `No order found for reference matching: ${orderNumber}`;
    }
  }

  citations = await searchKnowledgeBase(ctx.db, message);
  let answer = await generateAnswer(message, citations, ctx.history, extraContext);
  let confidence = estimateConfidence(citations, answer);

  if (confidence < CONFIDENCE_THRESHOLD || /connect you with a human|escalat/i.test(answer)) {
    const ticket = await createSupportTicket(ctx.db, {
      sessionId: ctx.sessionId,
      subject: "Low-confidence AI response escalation",
      description: `User: ${message}\n\nDraft answer: ${answer}`,
      priority: "medium",
    });
    ticketId = ticket?.id;
    toolUsed = toolUsed ? `${toolUsed},create_ticket` : "create_ticket";
    answer += `\n\nI've also opened ticket #${ticketId?.slice(0, 8)} for a human agent to review.`;
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
  }

  return {
    answer,
    citations,
    intent,
    confidence,
    toolUsed,
    ticketId,
    responseTimeMs: Date.now() - started,
  };
}

export async function* streamSupportAgent(
  ctx: AgentContext,
  message: string,
): AsyncGenerator<ChatStreamEvent> {
  const result = await runSupportAgent(ctx, message);

  if (result.citations.length > 0) {
    yield { type: "citations", citations: result.citations };
  }
  if (result.toolUsed) {
    yield { type: "tool", toolName: result.toolUsed };
  }
  if (result.ticketId) {
    yield { type: "ticket", ticketId: result.ticketId };
  }

  const words = result.answer.split(/(\s+)/);
  for (const word of words) {
    if (word) yield { type: "token", content: word };
  }

  yield { type: "done" };
}
