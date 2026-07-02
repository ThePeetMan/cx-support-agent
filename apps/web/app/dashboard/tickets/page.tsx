import { apiFetch } from "@/lib/api";

interface TicketRow {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default async function TicketsPage() {
  const tickets = await apiFetch<TicketRow[]>("/tickets");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tickets</h1>
        <p className="text-slate-400">Escalations created by the AI agent when confidence is low or a human is requested.</p>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-slate-400">
            <tr>
              <th className="p-4">Subject</th>
              <th className="p-4">Status</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-white/5 align-top">
                <td className="p-4">
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="mt-1 text-slate-400">{ticket.description.slice(0, 120)}...</p>
                </td>
                <td className="p-4">{ticket.status}</td>
                <td className="p-4">{ticket.priority}</td>
                <td className="p-4">{new Date(ticket.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
