import Script from "next/script";

export default function DemoPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const apiKey = process.env.NEXT_PUBLIC_WIDGET_API_KEY ?? "demo-widget-key-change-me";

  return (
    <main className="mx-auto min-h-screen max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Widget Demo</h1>
        <p className="mt-2 text-slate-300">
          This page simulates a customer website with the embeddable support widget in the bottom-right corner.
        </p>
      </div>
      <div className="card p-8">
        <h2 className="text-xl font-semibold">Sample SaaS Landing Page</h2>
        <p className="mt-4 text-slate-300">
          Ask about refunds, shipping, billing, or try order lookup with <code>ORD-1001</code>.
          Say &quot;talk to a human&quot; to trigger escalation.
        </p>
        <pre className="mt-6 overflow-x-auto rounded-xl bg-black/40 p-4 text-sm text-slate-300">{`<script
  src="/widget.js"
  data-api-url="${apiUrl}"
  data-api-key="${apiKey}"
  async
></script>`}</pre>
      </div>
      <Script
        src="/widget.js"
        strategy="afterInteractive"
        data-api-url={apiUrl}
        data-api-key={apiKey}
      />
    </main>
  );
}
