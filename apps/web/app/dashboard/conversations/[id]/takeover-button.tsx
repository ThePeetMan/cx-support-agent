"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TakeoverButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function takeover() {
    setLoading(true);
    try {
      await fetch(`/api/proxy/chat/sessions/${sessionId}/takeover`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="button secondary" onClick={takeover} disabled={loading}>
      {loading ? "Taking over..." : "Agent takeover"}
    </button>
  );
}
