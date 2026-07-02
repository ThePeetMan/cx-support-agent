import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 p-8 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">CX AI Solutions Portfolio</p>
      <h1 className="text-4xl font-bold">CX Support Agent</h1>
      <p className="max-w-xl text-slate-300">
        Production-style AI customer support: RAG knowledge base, agent tool-use, ticket escalation,
        embeddable widget, and admin analytics.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="button">
          Admin Login
        </Link>
        <Link href="/demo" className="button secondary">
          Widget Demo
        </Link>
      </div>
    </main>
  );
}
