"use client";

import { useEffect, useRef, useState } from "react";
import { chat, type ChatResponse } from "@/lib/api";
import { getPlatformId, isTelegramWebApp } from "@/lib/identity";

interface UiMessage {
  id: string;
  role: "user" | "agent";
  text: string;
}

export default function ChatPage() {
  const [platformId, setPlatformId] = useState<string>("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [agentName, setAgentName] = useState<string>("Your butler");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Resolve identity on mount + tell Telegram the WebApp is ready
  useEffect(() => {
    setPlatformId(getPlatformId());
    if (isTelegramWebApp()) {
      window.Telegram?.WebApp?.ready?.();
      window.Telegram?.WebApp?.expand?.();
    }
  }, []);

  // Autoscroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(): Promise<void> {
    const text = input.trim();
    if (!text || sending || !platformId) return;
    setInput("");
    setSending(true);

    const userMsg: UiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res: ChatResponse = await chat(platformId, text);
      if (res.context?.agentName) setAgentName(res.context.agentName);
      const agentMsg: UiMessage = {
        id: `a-${Date.now()}`,
        role: "agent",
        text: res.message,
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      const errMsg: UiMessage = {
        id: `e-${Date.now()}`,
        role: "agent",
        text: `⚠️ ${err instanceof Error ? err.message : "request failed"}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <main className="flex flex-col h-dvh bg-neutral-950 text-neutral-100">
      <header className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">{agentName}</h1>
          <p className="text-xs text-neutral-500">SAID Agent · {platformId || "..."}</p>
        </div>
        <a
          href="/portfolio"
          className="text-xs px-3 py-1 rounded-md border border-neutral-700 hover:border-neutral-500"
        >
          Wallet
        </a>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-neutral-500 text-sm pt-12">
            <p>Say hello — your agent is ready.</p>
            <p className="mt-2 text-xs">Try: &quot;what can you do?&quot; or &quot;check my portfolio&quot;.</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2"
                : "mr-auto max-w-[80%] bg-neutral-800 text-neutral-100 rounded-2xl rounded-bl-sm px-4 py-2 whitespace-pre-wrap"
            }
          >
            {m.text}
          </div>
        ))}
        {sending && (
          <div className="mr-auto bg-neutral-800 text-neutral-400 rounded-2xl rounded-bl-sm px-4 py-2 text-sm italic">
            thinking…
          </div>
        )}
      </div>

      <form
        className="px-4 py-3 border-t border-neutral-800 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message your agent…"
          rows={1}
          className="flex-1 resize-none rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm focus:outline-none focus:border-neutral-600 max-h-32"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 px-4 py-2 text-sm font-medium"
        >
          Send
        </button>
      </form>
    </main>
  );
}
