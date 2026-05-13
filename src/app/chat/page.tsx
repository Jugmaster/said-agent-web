"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { chat, getBalance, type ChatResponse } from "@/lib/api";
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
  const isFresh = messages.length === 0 && step === "unknown";

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] mt-20">
      <header className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">{agentName}</h1>
          <p className="text-xs text-zinc-500 font-mono">{platformId}</p>
        </div>
        <div className="flex gap-2">
          {needsFunding && (
            <Link
              href="/fund"
              className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
            >
              Activate
            </Link>
          )}
          <Link
            href="/portfolio"
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 transition"
          >
            Wallet
          </Link>
        </div>
      </header>

      {needsFunding && (
        <div className="px-4 py-3 bg-yellow-950/40 border-b border-yellow-900/60">
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
              className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold whitespace-nowrap"
            >
              Fund →
            </Link>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {isFresh && (
          <div className="max-w-md mx-auto pt-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">Meet your butler</h2>
              <p className="text-sm text-zinc-400 mb-5">
                A personal AI agent on Solana. Your own wallet, your own
                identity, yours forever.
              </p>
              <button
                onClick={() => void send("hi")}
                className="w-full px-4 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition"
              >
                Say hi to start
              </button>
            </div>
            <p className="text-xs text-zinc-600 text-center mt-4">
              Or try: &quot;create my agent&quot;, &quot;what can you do?&quot;
            </p>
          </div>
        )}
        {messages.length === 0 && step !== "unknown" && (
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
        className="px-4 py-3 border-t border-zinc-800 flex items-end gap-2"
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
          className="flex-1 resize-none rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm focus:outline-none focus:border-zinc-600 max-h-32"
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
