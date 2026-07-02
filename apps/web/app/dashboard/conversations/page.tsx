import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface SessionRow {
  id: string;
  visitorId: string;
  humanTakeover: boolean;
  createdAt: string;
  updatedAt: string;
}

export default async function ConversationsPage() {
  const sessions = await apiFetch<SessionRow[]>("/chat/sessions");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-slate-400">Review customer chat sessions and agent takeover status.</p>
      </div>
      <div className="card divide-y divide-white/5">
        {sessions.length === 0 ? (
          <p className="p-6 text-slate-400">No conversations yet. Try the widget demo.</p>
        ) : (
          sessions.map((session) => (
            <Link
              key={session.id}
              href={`/dashboard/conversations/${session.id}`}
              className="flex items-center justify-between p-4 hover:bg-white/5"
            >
              <div>
                <p className="font-medium">Session {session.id.slice(0, 8)}</p>
                <p className="text-sm text-slate-400">Visitor {session.visitorId.slice(0, 8)}</p>
              </div>
              <div className="text-right text-sm">
                <p>{session.humanTakeover ? "Human takeover" : "AI handled"}</p>
                <p className="text-slate-400">{new Date(session.updatedAt).toLocaleString()}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
