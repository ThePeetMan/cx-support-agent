"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@cx-demo.com");
  const [password, setPassword] = useState("demo12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <div className="card p-8">
        <h1 className="mb-2 text-2xl font-bold">Admin Login</h1>
        <p className="mb-6 text-sm text-slate-400">Demo: admin@cx-demo.com / demo12345</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button className="button w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          No account? <Link href="/signup" className="text-indigo-300">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
