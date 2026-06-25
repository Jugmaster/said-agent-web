"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { chat, getBalance, getConversations, type ChatResponse } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import Navbar from "@/components/Navbar";

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

function ChatScreen({ platformId }: { platformId: string }) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [agentName, setAgentName] = useState<string>("Your butler");
  const [step, setStep] = useState<AgentStep>("unknown");
  const [received, setReceived] = useState<{ count: number; lines: string[] } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Receive celebration: settle-on-login stashes a receipt in sessionStorage
  // (see useAgent). Read it once on landing, then clear so it shows a single time.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("said-agent:received");
      if (raw) {
        setReceived(JSON.parse(raw) as { count: number; lines: string[] });
        sessionStorage.removeItem("said-agent:received");
      }
    } catch {
      // ignore parse/storage errors
    }
  }, []);

  useEffect(() => {
    if (!platformId) return;
    getBalance(platformId)
      .then((b) => {
        if (b.displayName) setAgentName(b.displayName);
        if (b.verified) setStep("returning_verified");
        else if (b.registered) setStep("registered_unverified");
        else setStep("awaiting_name");
      })
      .catch(() => {
        // 404 → no agent yet, leave step="unknown" so the welcome card renders
      });

    // Load conversation history (up to 50 most-recent messages) so users
    // see their full chat with the agent when they log in on the web. Without
    // this, the PWA's chat starts blank every session even though butler.db
    // has logged everything.
    getConversations(platformId, 50)
      .then((r) => {
        if (!r.messages || r.messages.length === 0) return;
        setMessages(
          r.messages.map((m) => ({
            id: `h-${m.id}`,
            role: m.role === "assistant" ? "agent" : "user",
            text: m.content,
          })),
        );
      })
      .catch(() => {
        // best-effort — empty history is the existing fallback
      });
  }, [platformId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(text?: string): Promise<void> {
    const message = (text ?? input).trim();
    if (!message || sending) return;
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
  // Fresh = a brand-new agent that still needs to be named/activated. A PWA
  // login lands here as "awaiting_name" (registered=false), so gating only on
  // "unknown" (the Telegram-path 404 state) meant fresh web users fell through
  // to the "Welcome back" branch and were never prompted to name → never
  // activated (naming is what triggers the free sponsor-funded verify).
  const isFresh =
    messages.length === 0 &&
    (step === "unknown" || step === "provisioned" || step === "awaiting_name");
  const isReturning =
    messages.length === 0 &&
    (step === "verified" || step === "returning_verified");

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] mt-20 pb-[var(--tabbar-h)] md:pb-0">
      <header className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">{agentName}</h1>
          <p className="text-xs text-zinc-500 font-mono">{platformId}</p>
        </div>
        <div className="flex gap-2">
          {needsFunding && (
            <button
              type="button"
              onClick={() => void send("verify")}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-black font-semibold"
            >
              Verify
            </button>
          )}
          <Link
            href="/portfolio"
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 transition"
          >
            Wallet
          </Link>
        </div>
      </header>

      {received && (
        <div className="px-4 py-4 bg-gradient-to-b from-emerald-950/50 to-transparent border-b border-emerald-900/50">
          <div className="max-w-md mx-auto text-center">
            <div className="text-2xl mb-1">🎁</div>
            <p className="text-base font-semibold text-emerald-200">
              You received {received.lines
                .map((l) => l.match(/[\d.]+\s*(?:SOL|USDC)/i)?.[0])
                .filter(Boolean)
                .join(" + ") || `${received.count} transfer${received.count > 1 ? "s" : ""}`}
              !
            </p>
            <p className="text-xs text-emerald-300/70 mt-1">
              It’s in your wallet. Pass some on — send to a friend by @handle.
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              {received.lines
                .map((l) => l.match(/https?:\/\/[^\s)]*solscan[^\s)]*/)?.[0])
                .filter(Boolean)
                .slice(0, 1)
                .map((url) => (
                  <a
                    key={url}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                  >
                    View on Solscan ↗
                  </a>
                ))}
              <Link
                href="/send"
                className="text-xs font-semibold text-emerald-300 hover:text-emerald-200"
              >
                Send to a friend →
              </Link>
              <button
                type="button"
                onClick={() => setReceived(null)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {needsFunding && (
        <div className="px-4 py-3 bg-blue-950/30 border-b border-blue-900/50">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none">✨</span>
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-200">Activating your agent…</p>
              <p className="text-xs text-blue-300/80 mt-0.5">
                It&apos;s free and automatic — no SOL needed. Usually a few
                seconds; tap Verify if it doesn&apos;t land.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void send("verify")}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-black font-semibold whitespace-nowrap"
            >
              Verify
            </button>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {isFresh && (
          <div className="max-w-md mx-auto pt-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">
                {step === "unknown" ? "Meet your butler" : "Name your agent"}
              </h2>
              <p className="text-sm text-zinc-400 mb-5">
                {step === "unknown"
                  ? "A personal AI agent on Solana. Your own wallet, your own identity, yours forever."
                  : "One step to activate — give your agent a name. It's free, no SOL needed."}
              </p>
              {step === "unknown" ? (
                <button
                  onClick={() => void send("hi")}
                  className="w-full px-4 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition"
                >
                  Say hi to start
                </button>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {["Sage", "Apollo", "Rex", "Nova"].map((n) => (
                    <button
                      key={n}
                      onClick={() => void send(n)}
                      className="px-4 py-2 rounded-xl border border-zinc-700 hover:border-zinc-500 text-sm font-medium transition"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-600 text-center mt-4">
              {step === "unknown"
                ? 'Or try: "create my agent", "what can you do?"'
                : "Or type any name in the box below."}
            </p>
          </div>
        )}
        {isReturning && (
          <div className="text-center text-zinc-500 text-sm pt-12">
            <p>Welcome back, {agentName}.</p>
            <p className="mt-2 text-xs">
              Try: &quot;portfolio&quot; or &quot;swap 0.01 SOL for USDC&quot;.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] bg-white text-black rounded-2xl rounded-br-sm px-4 py-2"
                : "mr-auto max-w-[80%] bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl rounded-bl-sm px-4 py-2 whitespace-pre-wrap"
            }
          >
            {m.text}
          </div>
        ))}
        {sending && (
          <div className="mr-auto bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-2xl rounded-bl-sm px-4 py-2 text-sm italic">
            thinking…
          </div>
        )}
      </div>

      <form
        className="px-4 pt-3 border-t border-zinc-800 flex items-end gap-2"
        style={{
          paddingBottom: "max(0.75rem, calc(env(safe-area-inset-bottom) + 0.25rem))",
        }}
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
          className="flex-1 resize-none rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-base sm:text-sm focus:outline-none focus:border-zinc-600 max-h-32"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-xl bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 px-4 py-2 text-sm font-semibold transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <>
      <Navbar />
      <AuthGate>{(platformId) => <ChatScreen platformId={platformId} />}</AuthGate>
    </>
  );
}
