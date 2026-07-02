"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CreateDocumentForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "faq", title, question, answer }),
      });
      if (!res.ok) throw new Error(await res.text());
      setTitle("");
      setQuestion("");
      setAnswer("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-6 md:grid-cols-2">
      <input className="input md:col-span-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input className="input" placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} required />
      <input className="input" placeholder="Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} required />
      <button className="button md:col-span-2" disabled={loading}>{loading ? "Saving..." : "Add FAQ"}</button>
    </form>
  );
}
