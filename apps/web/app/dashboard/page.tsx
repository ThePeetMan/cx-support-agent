import { apiFetch } from "@/lib/api";
import type { AnalyticsSummary } from "@cx/shared";

export default async function DashboardPage() {
  const summary = await apiFetch<AnalyticsSummary>("/analytics/summary");

  const cards = [
    { label: "Conversations", value: summary.totalConversations },
    { label: "Messages", value: summary.totalMessages },
    { label: "Open Tickets", value: summary.openTickets },
    { label: "Escalation Rate", value: `${(summary.escalationRate * 100).toFixed(1)}%` },
    { label: "Avg Response", value: `${summary.avgResponseTimeMs} ms` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-slate-400">Customer support analytics and platform health.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="card p-5">
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="card p-6">
        <h2 className="text-xl font-semibold">What this demonstrates for CX AI roles</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300">
          <li>Embeddable web chat widget with SSE streaming</li>
          <li>RAG knowledge base with async ingestion (BullMQ + pgvector)</li>
          <li>Agent tool-use: knowledge search, order lookup, ticket escalation</li>
          <li>Human-in-the-loop via ticket creation and agent takeover stub</li>
          <li>Admin dashboard with conversations, tickets, and analytics</li>
        </ul>
      </div>
    </div>
  );
}
