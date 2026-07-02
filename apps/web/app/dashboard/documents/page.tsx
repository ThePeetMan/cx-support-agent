import { apiFetch } from "@/lib/api";
import { CreateDocumentForm } from "./create-form";

interface DocumentRow {
  id: string;
  title: string;
  sourceType: string;
  status: string;
  charCount: number | null;
  createdAt: string;
}

export default async function DocumentsPage() {
  const documents = await apiFetch<DocumentRow[]>("/documents");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-slate-400">Upload FAQs and notes for the support agent to retrieve.</p>
      </div>
      <CreateDocumentForm />
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-slate-400">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4">Chars</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-white/5">
                <td className="p-4">{doc.title}</td>
                <td className="p-4">{doc.sourceType}</td>
                <td className="p-4">
                  <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-indigo-200">{doc.status}</span>
                </td>
                <td className="p-4">{doc.charCount ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
