import { apiFetch } from "@/lib/api";
import { TakeoverButton } from "./takeover-button";

interface MessageRow {
  id: string;
  role: string;
  content: string;
  citations: unknown[];
  createdAt: string;
}

interface SessionDetail {
  id: string;
  visitorId: string;
  humanTakeover: boolean;
  messages: MessageRow[];
}

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await apiFetch<SessionDetail>(`/chat/sessions/${id}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conversation</h1>
          <p className="text-slate-400">Session {session.id}</p>
        </div>
        {!session.humanTakeover ? <TakeoverButton sessionId={session.id} /> : null}
      </div>
      <div className="card space-y-4 p-6">
        {session.messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-2xl rounded-2xl px-4 py-3 ${
                message.role === "user" ? "bg-indigo-600" : "bg-white/10"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
