"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAutopilot, getHandle, getTrades, type CreditsSummary } from "@/lib/api";

interface Quest { id: string; title: string; reward: string; href: string; cta: string; have: number; need: number; done: boolean }

/**
 * The ladder as a to-do list: what unlocks the next level and the next
 * funding, how far along you are, and where to go. Shown to everyone from
 * day one; the funded card above it is the prize.
 */
export default function LevelUp({ platformId, summary }: { platformId: string; summary: CreditsSummary | null | undefined }) {
  const [handle, setHandle] = useState<string | null | undefined>(undefined);
  const [traded, setTraded] = useState<number | null>(null);
  const [autopilot, setAutopilot] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    getHandle(platformId).then((h) => alive && setHandle(h?.handle ?? null)).catch(() => alive && setHandle(null));
    getTrades(platformId, { limit: 1 }).then((t) => alive && setTraded(t.length)).catch(() => alive && setTraded(0));
    getAutopilot(platformId).then((a) => alive && setAutopilot(a?.config.enabled ?? null)).catch(() => alive && setAutopilot(null));
    return () => { alive = false; };
  }, [platformId]);

  if (summary === null) return null; // API predates levels
  const s = summary;
  const level = s?.level ?? 1;
  const people = s?.next?.unit === "people" ? s.next : null;
  const days = s?.next?.unit === "days" ? s.next : null;
  const monthly = s?.funding.nextLevelUsd ?? 25;

  const quests: Quest[] = [
    { id: "people", title: "Pay five verified X accounts, $1 or more each", reward: `Level 2 · $${level >= 2 ? s?.funding.monthlyUsd ?? 25 : monthly} a month to trade with`, href: "/send", cta: "Pay someone", have: level >= 2 ? 5 : people?.have ?? 0, need: 5, done: level >= 2 },
    { id: "name", title: "Claim your @name", reward: "Your page: atcha.cash/@you", href: "/level", cta: "Claim it", have: handle ? 1 : 0, need: 1, done: !!handle },
    { id: "trade", title: "Make your first trade", reward: "A bubble on the chart with your reason on it", href: "/portfolio", cta: "Look up a token", have: traded ? 1 : 0, need: 1, done: !!traded },
    { id: "cash", title: "Add your own money", reward: "Trades without a cap, and pays anyone by name", href: "/fund", cta: "Add money", have: (s?.ownUsd ?? 0) > 0 ? 1 : 0, need: 1, done: (s?.ownUsd ?? 0) > 0 },
    { id: "auto", title: "Turn on Autopilot", reward: "It trades the budget for you and tells you why", href: "/level", cta: "Switch it on", have: autopilot ? 1 : 0, need: 1, done: !!autopilot },
    { id: "streak", title: `Keep a ${days?.need ?? 30}-day streak`, reward: `Level 3 · $75 a month, and your gains become yours`, href: "/level", cta: "Today's things", have: level >= 3 ? days?.need ?? 30 : days?.have ?? s?.streak ?? 0, need: days?.need ?? 30, done: level >= 3 },
  ];
  const doneCount = quests.filter((q) => q.done).length;

  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-grey">Level up</h2>
        <span className="text-[11px] text-grey">{doneCount} of {quests.length}</span>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {quests.map((q) => {
          const pct = Math.min(100, Math.round((q.have / q.need) * 100));
          return (
            <div key={q.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${q.done ? "bg-paper/60" : "bg-paper"}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${q.done ? "bg-up text-cream" : "bg-btn text-ink"}`}>{q.done ? "✓" : q.need > 1 ? `${q.have}/${q.need}` : "·"}</span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm ${q.done ? "text-grey line-through" : "text-ink"}`}>{q.title}</span>
                <span className="block truncate text-xs text-grey">{q.reward}</span>
                {!q.done && q.need > 1 && (
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-coral" style={{ width: `${pct}%` }} /></span>
                )}
              </span>
              {!q.done && <Link href={q.href} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-ink shadow-[inset_0_0_0_1px_var(--color-ring)] transition hover:bg-ink hover:text-cream">{q.cta}</Link>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
