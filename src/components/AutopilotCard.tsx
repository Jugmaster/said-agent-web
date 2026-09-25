"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAutopilot, runAutopilot, setAutopilot, type AutopilotDecision, type AutopilotRisk, type AutopilotState, type AutopilotStrategy } from "@/lib/api";
import { timeAgo } from "@/lib/format";

const RISKS: Array<{ id: AutopilotRisk; label: string; sub: string }> = [
  { id: "careful", label: "Careful", sub: "majors, tight stops, no scouting" },
  { id: "normal", label: "Normal", sub: "scouts momentum, stop at −20%, profit at +50%" },
  { id: "degen", label: "Degen", sub: "wider stops, lets winners run to 2x" },
];
const STRATS: Array<{ id: AutopilotStrategy; label: string; sub: string }> = [
  { id: "exit", label: "Exits", sub: "stops and take-profits on everything it holds" },
  { id: "trend", label: "Trend", sub: "parks half in USDC when SOL rolls over, back in on the turn" },
  { id: "scout", label: "Scout", sub: "small, capped entries on tokens with momentum" },
];
const usd = (v: number | null) => (v == null ? "" : `$${v.toFixed(2)}`);

/**
 * Autopilot: the switch, the risk, the strategies, and what it decided. In
 * shadow it writes decisions and moves nothing; that's the default, and the
 * card says so.
 */
export default function AutopilotCard({ platformId, funded }: { platformId: string; funded: boolean }) {
  const [st, setSt] = useState<AutopilotState | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const load = () => getAutopilot(platformId).then(setSt).catch(() => setSt(null));
  useEffect(() => { load(); }, [platformId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (st === undefined) return <section className="rounded-2xl border border-line bg-card p-4 text-xs text-grey">…</section>;
  if (st === null) return <section className="rounded-2xl border border-line bg-card p-4"><div className="text-xs font-medium uppercase tracking-wider text-grey">Autopilot</div><p className="mt-1 text-sm text-grey">Arrives with the next update.</p></section>;

  const c = st.config;
  const patch = async (p: Parameters<typeof setAutopilot>[1]) => { setBusy(true); const next = await setAutopilot(platformId, p); if (next) setSt({ ...st, config: next }); setBusy(false); };
  const toggleStrat = (id: AutopilotStrategy) => patch({ strategies: c.strategies.includes(id) ? c.strategies.filter((s) => s !== id) : [...c.strategies, id] });
  const shadow = c.shadow || st.globalShadow;

  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-grey">Autopilot</div>
          <div className="mt-0.5 text-sm text-ink">{c.enabled ? (shadow ? "On, in shadow: deciding, not trading yet" : "On, trading the budget") : "Off"}</div>
        </div>
        <button type="button" disabled={busy || !funded} onClick={() => patch({ enabled: !c.enabled })} aria-pressed={c.enabled} className={`relative h-7 w-12 shrink-0 rounded-full transition ${c.enabled ? "bg-up" : "bg-line"} disabled:opacity-40`} title={funded ? "" : "Get funded first"}>
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-paper shadow transition ${c.enabled ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>
      {!funded && <p className="mt-2 text-xs text-grey">Autopilot trades the budget. Reach level 2 and it switches on.</p>}

      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {RISKS.map((r) => (
          <button key={r.id} type="button" disabled={busy} onClick={() => patch({ risk: r.id })} className={`rounded-xl px-2 py-2 text-left transition ${c.risk === r.id ? "bg-ink text-cream" : "bg-paper text-ink hover:bg-btn"}`}>
            <div className="text-sm font-medium">{r.label}</div>
            <div className={`text-[11px] leading-snug ${c.risk === r.id ? "text-cream/70" : "text-grey"}`}>{r.sub}</div>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {STRATS.map((s) => (
          <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-paper">
            <input type="checkbox" checked={c.strategies.includes(s.id)} disabled={busy} onChange={() => toggleStrat(s.id)} className="h-4 w-4 accent-[var(--color-coral)]" />
            <span className="min-w-0 flex-1"><span className="block text-sm text-ink">{s.label}</span><span className="block truncate text-xs text-grey">{s.sub}</span></span>
          </label>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-2 text-grey">
          <input type="checkbox" checked={c.shadow} disabled={busy || st.globalShadow} onChange={(e) => patch({ shadow: e.target.checked })} className="h-4 w-4 accent-[var(--color-coral)]" />
          Shadow mode{st.globalShadow ? " (on for everyone right now)" : ""}
        </label>
        <span className="text-grey">·</span>
        <span className="text-grey">{st.jev ? "Judgment by Jev" : "Rules only (Jev not connected)"}</span>
        <button type="button" disabled={running || !c.enabled} onClick={async () => { setRunning(true); await runAutopilot(platformId); await load(); setRunning(false); }} className="ml-auto rounded-full px-3 py-1 text-ink shadow-[inset_0_0_0_1px_var(--color-ring)] transition hover:bg-ink hover:text-cream disabled:opacity-40">{running ? "Thinking…" : "Run now"}</button>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-grey">What it decided</div>
        {st.decisions.length === 0 ? (
          <p className="text-xs text-grey">Nothing yet. Every decision lands here with its reason, traded or not.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {st.decisions.slice(0, 8).map((d) => <DecisionRow key={d.id} d={d} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function DecisionRow({ d }: { d: AutopilotDecision }) {
  const tone = d.action === "buy" ? "bg-up-soft text-up" : d.action === "sell" ? "bg-down-soft text-down" : "bg-btn text-grey";
  return (
    <div className="flex items-start gap-2 rounded-lg bg-paper px-2.5 py-2 text-xs">
      <span className={`mt-0.5 rounded-md px-1.5 py-0.5 font-semibold uppercase ${tone}`}>{d.action}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-ink">{d.mint ? <Link href={`/token/${d.mint}`} className="underline underline-offset-2">{d.symbol ?? d.mint.slice(0, 6)}</Link> : d.symbol} · {d.reason}{d.sizeUsd ? ` · ${usd(d.sizeUsd)}` : ""}</span>
        <span className="block text-grey">{d.strategy} · {timeAgo(d.at)}{d.executed ? " · traded" : d.error === "shadow" ? " · shadow" : d.error ? ` · ${d.error}` : ""}{d.tx && <> · <a href={`https://solscan.io/tx/${d.tx}`} target="_blank" rel="noreferrer" className="underline">tx</a></>}</span>
      </span>
    </div>
  );
}
