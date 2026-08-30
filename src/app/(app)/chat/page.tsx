"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  chat,
  getActivity,
  getBalance,
  getConversations,
  type ActivityReceipt,
  type ChatResponse,
} from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import MessageText from "@/components/MessageText";
import { actionLabel, timeAgo } from "@/lib/format";
import { onRefresh, requestRefresh } from "@/lib/refresh";
import { usePrivy } from "@privy-io/react-auth";
import { useAgent } from "@/hooks/useAgent";
import { getPortfolio, type FullPortfolio } from "@/lib/api";

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

// Short enough to read on a chip; phrased as things you'd actually ask.
const MOBILE_PROMPTS = [
  "What can you do?",
  "Watch SOL under $150",
  "Show my holdings",
];

const QUICK_ACTIONS = [
  "What can you do?",
  "Show my portfolio",
  "Swap 0.01 SOL for USDC",
  "DCA $1 into SOL daily",
];

/**
 * Desktop-only (xl+) context rail beside the conversation: one-click prompts
 * and the latest on-chain receipts, so the agent's actions are visible next to
 * the chat that caused them. Balance lives in the sidebar, not here.
 */
function ChatContextRail({
  platformId,
  sending,
  onQuick,
}: {
  platformId: string;
  sending: boolean;
  onQuick: (text: string) => void;
}) {
  const [receipts, setReceipts] = useState<ActivityReceipt[] | null>(null);
  const [nonce, setNonce] = useState(0);

  // Re-fetch when anything moves funds (agent reply, send, deposit) so the
  // rail reflects the action the user just watched happen in chat.
  useEffect(() => onRefresh(() => setNonce((n) => n + 1)), []);

  useEffect(() => {
    getActivity(platformId)
      .then((r) => setReceipts(r.receipts.slice(0, 4)))
      .catch(() => setReceipts((prev) => prev ?? []));
  }, [platformId, nonce]);

  return (
    <aside className="hidden xl:flex w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-[var(--line)] p-5">
      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--faint)]">
          Quick actions
        </h2>
        <div className="flex flex-col gap-1.5">
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={sending}
              onClick={() => onQuick(q)}
              className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-left text-sm text-[var(--ink)] transition hover:border-[var(--dim)] hover:text-[var(--ink)] disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--faint)]">
            Recent activity
          </h2>
          <Link
            href="/activity"
            className="text-[11px] text-[var(--faint)] transition hover:text-[var(--ink)]"
          >
            View all →
          </Link>
        </div>
        {receipts === null ? (
          <p className="text-xs text-[var(--faint)]">Loading…</p>
        ) : receipts.length === 0 ? (
          <p className="text-xs text-[var(--faint)] italic">
            Nothing on-chain yet. Try a swap.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {receipts.map((r) => {
              const label = actionLabel(r.type);
              return (
                <div
                  key={r.seq}
                  className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2"
                >
                  <span className="text-base leading-none">{label.emoji}</span>
                  <span className={`flex-1 text-sm font-medium ${label.color}`}>
                    {label.text}
                  </span>
                  <span className="text-[11px] text-[var(--faint)]">
                    {timeAgo(r.occurredAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </aside>
  );
}

function ChatScreen({ platformId }: { platformId: string }) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [agentName, setAgentName] = useState<string>("Your butler");
  const [step, setStep] = useState<AgentStep>("unknown");
  const [received, setReceived] = useState<{ count: number; lines: string[] } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Mobile-only: this screen is home, so it carries the balance. Same source
  // as the desktop dashboard so the two can never disagree.
  const agent = useAgent();
  const { user: privyUser } = usePrivy();
  const walletAddress = agent.status === "ready" ? agent.walletAddress : null;
  const [portfolio, setPortfolio] = useState<FullPortfolio | null>(null);
  useEffect(() => {
    if (!walletAddress) return;
    let cancelled = false;
    const load = () =>
      getPortfolio(walletAddress)
        .then((p) => !cancelled && setPortfolio(p))
        .catch(() => {});
    void load();
    return onRefresh(() => void load());
  }, [walletAddress]);

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
    // has logged everything. Prepend rather than replace: a message the user
    // fired before this resolved (e.g. a ⌘K prompt) must not be wiped.
    getConversations(platformId, 50)
      .then((r) => {
        if (!r.messages || r.messages.length === 0) return;
        const history: UiMessage[] = r.messages.map((m) => ({
          id: `h-${m.id}`,
          role: m.role === "assistant" ? "agent" : "user",
          text: m.content,
        }));
        setMessages((prev) => (prev.length ? [...history, ...prev] : history));
      })
      .catch(() => {
        // best-effort — empty history is the existing fallback
      });
  }, [platformId]);

  // First settle (50 messages of history arriving after paint) must be
  // instant: smooth-scrolling that many bubbles on a phone gets interrupted by
  // layout and strands the user mid-conversation. Subsequent sends animate.
  const didFirstScroll = useRef(false);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: didFirstScroll.current ? "smooth" : "auto",
    });
    if (messages.length) didFirstScroll.current = true;
  }, [messages]);

  // iOS Safari ignores interactiveWidget, so dvh does NOT shrink for the
  // keyboard and the composer ends up behind it. visualViewport is the only
  // reliable signal; publish the keyboard height as --kb for the padding below.
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const sync = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--kb", `${kb}px`);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      document.documentElement.style.setProperty("--kb", "0px");
    };
  }, []);

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
      // The reply may have moved funds (swap, send, DCA) — let the sidebar
      // balance and activity rail catch up.
      requestRefresh();
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

  // Latest send() for listeners registered once on mount.
  const sendRef = useRef(send);
  sendRef.current = send;

  // ⌘K palette hand-offs: a pending prompt stashed in sessionStorage by
  // AppShell (read once, then cleared), and the "said:ask" event when already
  // on /chat. A ?prompt= in the URL only prefills the composer — external
  // links must never auto-execute commands against the wallet.
  const autoRan = useRef(false);
  useEffect(() => {
    if (!autoRan.current) {
      autoRan.current = true;
      let pending: string | null = null;
      try {
        pending = sessionStorage.getItem("said-agent:pending-prompt");
        if (pending) sessionStorage.removeItem("said-agent:pending-prompt");
      } catch {
        // storage unavailable
      }
      if (pending) {
        void sendRef.current(pending);
      } else {
        const prompt = new URLSearchParams(window.location.search).get("prompt");
        if (prompt) {
          router.replace("/chat");
          setInput(prompt);
        }
      }
    }
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent<string>).detail;
      if (q) void sendRef.current(q);
    };
    window.addEventListener("said:ask", onAsk);
    return () => window.removeEventListener("said:ask", onAsk);
  }, [router]);

  // Desktop: composer is always a keystroke away — autofocus on pointer-fine
  // devices (no keyboard pop on touch), and "/" refocuses from anywhere.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const editing =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (editing) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
  // Their own handle, from whichever account they signed in with.
  const userHandle =
    privyUser?.twitter?.username
      ? `@${privyUser.twitter.username}`
      : privyUser?.telegram?.username
        ? `@${privyUser.telegram.username}`
        : null;
  const isLive = step === "verified" || step === "returning_verified";

  const isReturning =
    messages.length === 0 &&
    (step === "verified" || step === "returning_verified");

  return (
    <div className="flex h-dvh md:h-dvh pb-[calc(var(--tabbar-h)+var(--kb,0px))] md:pb-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[var(--line)] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 md:px-6 md:pt-3">
          {/* Mobile: this screen is home, so the balance lives here. Desktop
              keeps its sidebar total and skips this strip entirely. */}
          <div className="mx-auto mb-3 w-full max-w-3xl md:hidden">
            <Link href="/portfolio" className="block">
              <div className="text-[11px] uppercase tracking-wide text-[var(--faint)]">
                Your balance
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-[var(--ink)]">
                  {portfolio?.totalUsdValue != null
                    ? `$${portfolio.totalUsdValue.toFixed(2)}`
                    : "···"}
                </span>
                <span className="text-xs text-[var(--faint)]">
                  {portfolio ? `${portfolio.solBalance.toFixed(3)} SOL` : ""}
                </span>
              </div>
            </Link>
          </div>
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
            <div>
              <h1 className="text-base font-semibold">{agentName}</h1>
              {/* Never the backend platform id: it means nothing to a user and
                  reads like a leaked internal. Their own handle plus live
                  status is the same line's worth of space, actually useful. */}
              <p className="text-xs text-[var(--faint)]">
                {isLive ? (
                  <span className="text-[var(--good)]">● Live on SAID</span>
                ) : (
                  <span>Setting up</span>
                )}
                {userHandle ? ` · ${userHandle}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {needsFunding && (
                <button
                  type="button"
                  onClick={() => void send("verify")}
                  className="text-sm px-3.5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-[var(--bg)] font-semibold"
                >
                  Verify
                </button>
              )}
              <Link
                href="/portfolio"
                className="md:hidden text-sm px-3.5 py-2.5 rounded-lg border border-[var(--line)] hover:border-[var(--ink)] transition"
              >
                Wallet
              </Link>
            </div>
          </div>
        </header>

        {received && (
          <div className="px-4 py-4 bg-gradient-to-b from-[rgba(61,163,93,.12)] to-transparent border-b border-[rgba(61,163,93,.30)]">
            <div className="max-w-md mx-auto text-center">
              <div className="text-2xl mb-1">🎁</div>
              <p className="text-base font-semibold text-[var(--good)]">
                You received {received.lines
                  .map((l) => l.match(/[\d.]+\s*(?:SOL|USDC)/i)?.[0])
                  .filter(Boolean)
                  .join(" + ") || `${received.count} transfer${received.count > 1 ? "s" : ""}`}
                !
              </p>
              <p className="text-xs text-[var(--good)] mt-1">
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
                      className="text-xs text-[var(--good)] underline underline-offset-2 hover:text-[var(--good)]"
                    >
                      View on Solscan ↗
                    </a>
                  ))}
                <Link
                  href="/send"
                  className="text-xs font-semibold text-[var(--good)] hover:text-[var(--good)]"
                >
                  Send to a friend →
                </Link>
                <button
                  type="button"
                  onClick={() => setReceived(null)}
                  className="text-xs text-[var(--faint)] hover:text-[var(--ink)]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {needsFunding && (
          <div className="px-4 py-3 bg-blue-950/30 border-b border-blue-900/50">
            <div className="mx-auto flex w-full max-w-3xl items-start gap-3">
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
                className="text-sm px-3.5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-[var(--bg)] font-semibold whitespace-nowrap"
              >
                Verify
              </button>
            </div>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 md:px-6">
          <div className="mx-auto w-full max-w-3xl space-y-4">
            {isFresh && (
              <div className="max-w-md mx-auto pt-8">
                <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 text-center">
                  <h2 className="text-lg font-semibold mb-2">
                    {step === "unknown" ? "Meet your butler" : "Name your agent"}
                  </h2>
                  <p className="text-sm text-[var(--dim)] mb-5">
                    {step === "unknown"
                      ? "A personal AI agent on Solana. Your own wallet, your own identity, yours forever."
                      : "One step to activate — give your agent a name. It's free, no SOL needed."}
                  </p>
                  {step === "unknown" ? (
                    <button
                      onClick={() => void send("hi")}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--ink)] text-[var(--bg)] font-semibold hover:opacity-85 transition"
                    >
                      Say hi to start
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {["Sage", "Apollo", "Rex", "Nova"].map((n) => (
                        <button
                          key={n}
                          onClick={() => void send(n)}
                          className="px-4 py-2 rounded-xl border border-[var(--line)] hover:border-[var(--ink)] text-sm font-medium transition"
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-[var(--faint)] text-center mt-4">
                  {step === "unknown"
                    ? 'Or try: "create my agent", "what can you do?"'
                    : "Or type any name in the box below."}
                </p>
              </div>
            )}
            {isReturning && (
              <div className="text-center text-[var(--faint)] text-sm pt-12">
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
                    ? "ml-auto max-w-[80%] md:max-w-[70%] w-fit min-w-0 bg-[var(--ink)] text-[var(--bg)] rounded-2xl rounded-br-sm px-4 py-2 whitespace-pre-wrap break-words"
                    : "mr-auto max-w-[80%] md:max-w-[70%] w-fit min-w-0 bg-[var(--card)] border border-[var(--line)] text-[var(--ink)] rounded-2xl rounded-bl-sm px-4 py-2 whitespace-pre-wrap break-words"
                }
              >
                {m.role === "user" ? m.text : <MessageText text={m.text} />}
              </div>
            ))}
            {sending && (
              <div className="mr-auto w-fit bg-[var(--card)] border border-[var(--line)] text-[var(--faint)] rounded-2xl rounded-bl-sm px-4 py-2 text-sm italic">
                thinking…
              </div>
            )}
          </div>
        </div>

        <form
          className="border-t border-[var(--line)] px-4 pt-3 md:px-6"
          style={{
            paddingBottom: "max(0.75rem, calc(env(safe-area-inset-bottom) + 0.25rem))",
          }}
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="mx-auto w-full max-w-3xl">
            {/* Mobile action rail: the desktop context rail is xl-only, so on a
                phone there was nothing tappable at all. These are the jobs, not
                navigation: two go to typed flows, the rest talk to the agent. */}
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                href="/calls"
                className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--card)] px-3.5 py-2 text-sm font-medium text-[var(--ink)] active:bg-[rgba(128,128,128,.18)]"
              >
                ☏ Comms
              </Link>
              {MOBILE_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  disabled={sending}
                  className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--dim)] active:bg-[var(--card)] disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Autogrow: without this max-h-32 never engages and a
                  // multi-sentence message scrolls inside one 24px line.
                  e.target.style.height = "auto";
                  const next = Math.min(e.target.scrollHeight, 128);
                  e.target.style.height = `${next}px`;
                  // Only scroll once it has actually hit the cap. Left on auto
                  // the browser paints a scrollbar the moment content meets the
                  // box, which on mobile is a permanent grey stripe.
                  e.target.style.overflowY =
                    e.target.scrollHeight > 128 ? "auto" : "hidden";
                }}
                onKeyDown={onKeyDown}
                placeholder="Message your agent…"
                rows={1}
                className="flex-1 resize-none overflow-y-hidden rounded-xl bg-[var(--card)] border border-[var(--line)] px-4 py-2 text-base sm:text-sm focus:outline-none focus:border-[var(--dim)] max-h-32"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded-xl bg-[var(--ink)] text-[var(--bg)] hover:opacity-85 disabled:bg-[rgba(128,128,128,.18)] disabled:text-[var(--faint)] px-4 py-2 text-sm font-semibold transition"
              >
                Send
              </button>
            </div>
            <div className="hidden md:flex items-center justify-between pt-1.5 text-[11px] text-[var(--faint)]">
              <span>Enter to send · Shift+Enter for a new line</span>
              <span>/ to focus · ⌘K anywhere</span>
            </div>
          </div>
        </form>
      </div>

      <ChatContextRail
        platformId={platformId}
        sending={sending}
        onQuick={(q) => void send(q)}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGate>{(platformId) => <ChatScreen platformId={platformId} />}</AuthGate>
  );
}
