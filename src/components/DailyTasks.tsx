"use client";

import Link from "next/link";
import type { CreditTask } from "@/lib/api";

/*
 * Today's three. Each row hands off to the agent with the task as the prompt.
 * Rows that need the user's own money say so when there is none, instead of
 * failing later.
 */

const PROMPTS: Record<CreditTask["type"], (t: CreditTask) => string> = {
  trade: (t) => `Swap $${t.minUsd} of my credit into SOL`,
  lock: () => "Stake for a better rate",
  pay: (t) => `Send $${t.minUsd} to @`,
  hire: (t) => `Hire an agent for a $${t.minUsd} job`,
  buy: (t) => `Buy something for about $${t.minUsd}`,
};

export default function DailyTasks({
  tasks,
  ownUsd,
  streak,
}: {
  tasks: CreditTask[] | null;
  ownUsd: number;
  streak: number;
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Today</h2>
        <span className="text-[11px] text-zinc-500">{streak > 0 ? `${streak}-day streak` : "Start a streak"}</span>
      </div>
      {tasks === null ? (
        <p className="text-xs text-zinc-600">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-xs italic text-zinc-600">Tasks appear once your Atcha is funded.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {tasks.map((t) => {
            const blocked = t.needsOwnMoney && ownUsd <= 0;
            const href = blocked ? "/fund" : `/chat?prompt=${encodeURIComponent(PROMPTS[t.type](t))}`;
            return (
              <Link
                key={t.id}
                href={href}
                className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 transition hover:border-zinc-600"
              >
                <span
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] leading-none ${
                    t.done ? "border-green-500 text-green-500" : "border-zinc-600 text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-medium ${t.done ? "text-zinc-500 line-through" : "text-white"}`}>
                    {t.title}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">
                    {blocked ? "Needs your own money. Add some to do this one." : t.detail}
                  </span>
                </span>
                <span className="text-[11px] text-zinc-500">{t.scores ? "levels you up" : "streak"}</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
