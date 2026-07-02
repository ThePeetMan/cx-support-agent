"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <div className="card p-8">
        <h1 className="mb-6 text-2xl font-bold">Create Admin Account</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 chars)" required />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button className="button w-full" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          Already have an account? <Link href="/login" className="text-indigo-300">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
