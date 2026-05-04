"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { chat, getBalance, type ChatResponse } from "@/lib/api";
import { getPlatformId, isTelegramWebApp } from "@/lib/identity";

interface UiMessage {
  id: string;
  role: "user" | "agent";
  text: string;
}

type AgentStep =
  | "unknown"
  | "provisioned"
  | "awaiting_name"
  | "registered"
  | "registered_unverified"
  | "verified"
  | "returning_verified";

export default function ChatPage() {
  const [platformId, setPlatformId] = useState<string>("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [agentName, setAgentName] = useState<string>("Your butler");
  const [step, setStep] = useState<AgentStep>("unknown");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = getPlatformId();
    setPlatformId(id);
    if (isTelegramWebApp()) {
      window.Telegram?.WebApp?.ready?.();
      window.Telegram?.WebApp?.expand?.();
    }

    // Pre-load existing agent state so we know whether to show "Say hi" CTA,
    // "needs funding" banner, or just an empty chat for a returning verified user.
    getBalance(id)
      .then((b) => {
        if (b.displayName) setAgentName(b.displayName);
        if (b.verified) setStep("returning_verified");
        else if (b.registered) setStep("registered_unverified");
        else setStep("awaiting_name");
      })
      .catch(() => {
        // 404 → no agent yet, leave step="unknown" so the welcome card renders
      });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(text?: string): Promise<void> {
    const message = (text ?? input).trim();
    if (!message || sending || !platformId) return;
    if (!text) setInput("");
    setSending(true);

    const userMsg: UiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: message,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res: ChatResponse = await chat(platformId, message);
      if (res.context?.agentName) setAgentName(res.context.agentName);
      if (res.context?.step) setStep(res.context.step as AgentStep);
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

  const needsFunding =
    step === "registered" || step === "registered_unverified";
  // Welcome card only for users with no agent yet AND no messages
  const isFresh = messages.length === 0 && step === "unknown";

  return (
    <main className="flex flex-col h-dvh bg-neutral-950 text-neutral-100">
      <header className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">{agentName}</h1>
          <p className="text-xs text-neutral-500">SAID Agent · {platformId || "..."}</p>
        </div>
        <div className="flex gap-2">
          {needsFunding && (
            <Link
              href="/fund"
              className="text-xs px-3 py-1 rounded-md bg-yellow-600 hover:bg-yellow-500 text-white font-medium animate-pulse"
            >
              Activate
            </Link>
          )}
          <Link
            href="/portfolio"
            className="text-xs px-3 py-1 rounded-md border border-neutral-700 hover:border-neutral-500"
          >
            Wallet
          </Link>
        </div>
      </header>

      {needsFunding && (
        <div className="px-4 py-3 bg-yellow-950/40 border-b border-yellow-900">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none">⚠️</span>
            <div className="flex-1 text-sm">
              <p className="font-medium text-yellow-200">Your agent needs activation</p>
              <p className="text-xs text-yellow-300/80 mt-0.5">
                Send 0.015 SOL to its wallet to unlock swaps, transfers, and more.
              </p>
            </div>
            <Link
              href="/fund"
              className="text-xs px-3 py-1.5 rounded-md bg-yellow-600 hover:bg-yellow-500 text-white font-medium whitespace-nowrap"
            >
              Fund →
            </Link>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {isFresh && (
          <div className="max-w-md mx-auto pt-8">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">Meet your butler</h2>
              <p className="text-sm text-neutral-400 mb-5">
                A personal AI agent on Solana. Your own wallet, your own identity,
                yours forever. Free, no signup.
              </p>
              <button
                onClick={() => void send("hi")}
                className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium"
              >
                Say hi to start
              </button>
            </div>
            <p className="text-xs text-neutral-600 text-center mt-4">
              Or try: &quot;create my agent&quot;, &quot;what can you do?&quot;
            </p>
          </div>
        )}
        {messages.length === 0 && step !== "unknown" && (
          <div className="text-center text-neutral-500 text-sm pt-12">
            <p>Welcome back, {agentName}.</p>
            <p className="mt-2 text-xs">Try: &quot;portfolio&quot; or &quot;swap 0.01 SOL for USDC&quot;.</p>
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
