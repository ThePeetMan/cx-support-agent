interface WidgetConfig {
  apiUrl: string;
  apiKey: string;
}

interface ChatStreamEvent {
  type: string;
  content?: string;
  citations?: Array<{ documentTitle: string; content: string }>;
  ticketId?: string;
  toolName?: string;
}

class CxWidget {
  private config: WidgetConfig;
  private sessionId: string | null = null;
  private root: HTMLElement | null = null;
  private messagesEl: HTMLElement | null = null;
  private open = false;

  constructor(config: WidgetConfig) {
    this.config = config;
    this.sessionId = localStorage.getItem("cx_session_id");
    this.render();
  }

  private render() {
    const container = document.createElement("div");
    container.id = "cx-support-widget";
    container.innerHTML = `
      <style>
        #cx-support-widget { position: fixed; right: 20px; bottom: 20px; z-index: 99999; font-family: Inter, system-ui, sans-serif; }
        #cx-support-widget .launcher { width: 56px; height: 56px; border-radius: 999px; border: none; background: #6366f1; color: white; cursor: pointer; box-shadow: 0 10px 30px rgba(99,102,241,.45); }
        #cx-support-widget .panel { display: none; width: 360px; max-height: 520px; background: #0f172a; color: #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,.35); border: 1px solid rgba(148,163,184,.2); margin-bottom: 12px; }
        #cx-support-widget .panel.open { display: flex; flex-direction: column; }
        #cx-support-widget .header { padding: 14px 16px; background: #111827; font-weight: 600; }
        #cx-support-widget .messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; min-height: 280px; }
        #cx-support-widget .bubble { max-width: 85%; padding: 10px 12px; border-radius: 14px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; }
        #cx-support-widget .bubble.user { align-self: flex-end; background: #6366f1; }
        #cx-support-widget .bubble.bot { align-self: flex-start; background: rgba(255,255,255,.08); }
        #cx-support-widget .composer { display: flex; gap: 8px; padding: 12px; border-top: 1px solid rgba(148,163,184,.15); }
        #cx-support-widget input { flex: 1; border-radius: 10px; border: 1px solid rgba(148,163,184,.25); background: rgba(15,23,42,.8); color: white; padding: 10px 12px; }
        #cx-support-widget button.send { border: none; border-radius: 10px; background: #6366f1; color: white; padding: 0 14px; cursor: pointer; }
        #cx-support-widget .typing { font-size: 12px; color: #94a3b8; padding: 0 12px 8px; }
      </style>
      <div class="panel" id="cx-panel">
        <div class="header">Support Assistant</div>
        <div class="messages" id="cx-messages"></div>
        <div class="typing" id="cx-typing" hidden>Assistant is typing...</div>
        <div class="composer">
          <input id="cx-input" placeholder="Ask about billing, shipping, orders..." />
          <button class="send" id="cx-send">Send</button>
        </div>
      </div>
      <button class="launcher" id="cx-launcher">💬</button>
    `;
    document.body.appendChild(container);

    this.root = container;
    this.messagesEl = container.querySelector("#cx-messages");
    container.querySelector("#cx-launcher")?.addEventListener("click", () => this.toggle());
    container.querySelector("#cx-send")?.addEventListener("click", () => void this.send());
    container.querySelector("#cx-input")?.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") void this.send();
    });

    this.addBotMessage("Hi! I can help with refunds, shipping, billing, and order status.");
  }

  private toggle() {
    this.open = !this.open;
    this.root?.querySelector("#cx-panel")?.classList.toggle("open", this.open);
  }

  private addMessage(text: string, role: "user" | "bot") {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${role}`;
    bubble.textContent = text;
    this.messagesEl?.appendChild(bubble);
    this.messagesEl?.scrollTo({ top: this.messagesEl.scrollHeight, behavior: "smooth" });
  }

  private addBotMessage(text: string) {
    this.addMessage(text, "bot");
  }

  private async ensureSession() {
    if (this.sessionId) return;
    const res = await fetch(`${this.config.apiUrl}/chat/sessions`, {
      method: "POST",
      headers: { "x-api-key": this.config.apiKey },
    });
    const data = (await res.json()) as { sessionId: string };
    this.sessionId = data.sessionId;
    localStorage.setItem("cx_session_id", this.sessionId);
  }

  private async send() {
    const input = this.root?.querySelector("#cx-input") as HTMLInputElement | null;
    const typing = this.root?.querySelector("#cx-typing") as HTMLElement | null;
    if (!input?.value.trim()) return;

    const message = input.value.trim();
    input.value = "";
    this.addMessage(message, "user");
    typing?.removeAttribute("hidden");

    await this.ensureSession();

    const res = await fetch(`${this.config.apiUrl}/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
      },
      body: JSON.stringify({ message, sessionId: this.sessionId }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let botText = "";
    let botBubble: HTMLDivElement | null = null;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const event = JSON.parse(payload) as ChatStreamEvent;
            if (event.type === "token" && event.content) {
              botText += event.content;
              if (!botBubble) {
                botBubble = document.createElement("div");
                botBubble.className = "bubble bot";
                this.messagesEl?.appendChild(botBubble);
              }
              botBubble.textContent = botText;
              this.messagesEl?.scrollTo({ top: this.messagesEl.scrollHeight, behavior: "smooth" });
            }
          } catch {
            // ignore malformed SSE chunks
          }
        }
      }
    }

    typing?.setAttribute("hidden", "true");
    if (!botText) this.addBotMessage("Sorry, I couldn't respond right now.");
  }
}

(function init() {
  const script = document.currentScript as HTMLScriptElement | null;
  const apiUrl = script?.dataset.apiUrl ?? "http://localhost:3001";
  const apiKey = script?.dataset.apiKey ?? "";
  new CxWidget({ apiUrl, apiKey });
})();

export {};
