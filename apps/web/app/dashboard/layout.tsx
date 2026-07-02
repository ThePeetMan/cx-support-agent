import Link from "next/link";
import { ReactNode } from "react";
import { requireSession } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/documents", label: "Knowledge Base" },
  { href: "/dashboard/conversations", label: "Conversations" },
  { href: "/dashboard/tickets", label: "Tickets" },
  { href: "/demo", label: "Widget Demo" },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireSession();

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-indigo-300">CX Support Agent</p>
            <p className="font-semibold">{user.name}</p>
          </div>
          <nav className="flex gap-4 text-sm">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-slate-300 hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
