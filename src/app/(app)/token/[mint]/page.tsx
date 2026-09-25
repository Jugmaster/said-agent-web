"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import MessageText from "@/components/MessageText";
import TokenChart, { fmtMc, fmtPrice } from "@/components/token/TokenChart";
import { useAgent } from "@/hooks/useAgent";
import { chat, getPortfolio, getPositions, getTokenStats, getTrades, type Position, type TokenStats, type TradeRow } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { requestRefresh } from "@/lib/refresh";

const usd = (v: number | null | undefined, d = 2) => (v == null ? "$—" : `$${v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`);
const pct = (v: number | null | undefined) => (v == null ? "—" : `${v >= 0 ? "▲" : "▼"} ${Math.abs(v).toFixed(2)}%`);
const tone = (v: number | null | undefined) => (v == null ? "text-grey" : v >= 0 ? "text-[#157E4E]" : "text-[#B93A16]");
const SAID_API = process.env.NEXT_PUBLIC_SAID_API ?? "https://api.saidprotocol.com";

interface Passport {
  verdict: string;
  reasons: string[];
  issuer: { name: string } | null;
  market: { launchpad: string | null; dev: string | null; holders: number | null; liquidityUsd: number | null; organicScore: number | null; verifiedOnJupiter: boolean } | null;
  impersonating: unknown;
}

/**
 * The token page: the chart with the agent's fills on it, the stats a trader
 * reads, the trust line, your position, the agent's trades here, and "tell
 * your agent" instead of a buy panel. Same shape as a trading app's token
 * view; the agent is what makes it ours.
 */
export default function TokenPage() {
  const { mint } = useParams<{ mint: string }>();
  return <AuthGate>{(platformId) => <Token platformId={platformId} mint={mint} />}</AuthGate>;
}

function Token({ platformId, mint }: { platformId: string; mint: string }) {
  const agent = useAgent();
  const wallet = agent.status === "ready" ? agent.walletAddress : null;
  const [stats, setStats] = useState<TokenStats | null | undefined>(undefined);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [qty, setQty] = useState<number | null>(null);
  const [passport, setPassport] = useState<Passport | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [custom, setCustom] = useState("");

  const load = useCallback(() => {
    getTokenStats(mint).then(setStats).catch(() => setStats(null));
    getTrades(platformId, { mint }).then(setTrades).catch(() => {});
    getPositions(platformId).then((ps) => setPosition(ps.find((p) => p.mint === mint) ?? null)).catch(() => {});
    if (wallet) getPortfolio(wallet).then((p) => setQty(mint === "So11111111111111111111111111111111111111112" ? p.solBalance : p.tokens.find((t) => t.mint === mint)?.balance ?? 0)).catch(() => {});
    fetch(`${SAID_API}/api/asset/${mint}`).then((r) => (r.ok ? r.json() : null)).then(setPassport).catch(() => {});
  }, [mint, platformId, wallet]);
  useEffect(() => { load(); }, [load]);

  const symbol = stats?.symbol ?? mint.slice(0, 4);
  const price = stats?.priceUsd ?? null;
  const value = qty != null && price != null ? qty * price : null;
  const pnl = position && value != null && position.qty > 0 ? value - position.costUsd : null;
  const pnlPct = pnl != null && position && position.costUsd > 0 ? (pnl / position.costUsd) * 100 : null;
  const age = stats?.createdAt ? timeAgo(stats.createdAt).replace(" ago", "") : null;

  const tell = async (text: string) => {
    setBusy(text); setReply(null);
    try {
      const r = await chat(platformId, text);
      setReply(r.message);
      requestRefresh();
      setTimeout(load, 2500);
    } catch (e) {
      setReply(e instanceof Error ? e.message : "That didn't go through.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(var(--tabbar-h)+1.5rem)] md:px-8 md:pt-8 md:pb-12">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {stats?.imageUrl ? <img src={stats.imageUrl} alt="" className="h-11 w-11 rounded-full bg-card object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-sm font-semibold">{symbol.slice(0, 3)}</span>}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{stats?.name ?? symbol}</h1>
              <span className="text-sm text-grey">{symbol}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-grey">
              <code className="font-mono">{mint.slice(0, 4)}…{mint.slice(-4)}</code>
              <button type="button" onClick={() => navigator.clipboard.writeText(mint).catch(() => {})} className="hover:text-ink">copy</button>
              {stats?.launchpad && <span>· {stats.launchpad}</span>}
              {age && <span>· {age} old</span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tracking-tight">{stats?.marketCapUsd != null ? `${fmtMc(stats.marketCapUsd)} MC` : price != null ? fmtPrice(price) : "—"}</div>
          <div className={`text-sm ${tone(stats?.change.h24)}`}>{pct(stats?.change.h24)} 24h{price != null && stats?.marketCapUsd != null ? <span className="text-grey"> · {fmtPrice(price)}</span> : null}</div>
        </div>
      </div>

      {/* Checked: the trust line, where the eye is. */}
      {passport && <TrustLine p={passport} stats={stats ?? null} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="rounded-2xl border border-line bg-[#FFFFFF] p-3">
            <TokenChart mint={mint} pool={stats?.poolId ?? null} ready={stats !== undefined} trades={trades} supply={stats?.supply ?? null} />
          </div>

          {/* Stats a trader reads */}
          {stats && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["m5", "h1", "h6", "h24"] as const).map((k) => (
                <div key={k} className="rounded-xl border border-line bg-card px-3 py-2 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-grey">{k === "m5" ? "5m" : k}</div>
                  <div className={`text-sm font-medium ${tone(stats.change[k])}`}>{pct(stats.change[k])}</div>
                </div>
              ))}
              <Bar label="buys" a={stats.txns24h.buys} bLabel="sells" b={stats.txns24h.sells} />
              {stats.buyers24h != null && stats.sellers24h != null && <Bar label="buyers" a={stats.buyers24h} bLabel="sellers" b={stats.sellers24h} />}
              <Fact label="Volume 24h" value={stats.volume24hUsd != null ? fmtMc(stats.volume24hUsd) : "—"} />
              <Fact label="Liquidity" value={stats.liquidityUsd != null ? fmtMc(stats.liquidityUsd) : "—"} />
              <Fact label="Supply" value={stats.supply != null ? fmtMc(stats.supply).replace("$", "") : "—"} />
              <Fact label="Venue" value={stats.dex ?? "—"} />
              {passport?.market?.holders != null && <Fact label="Holders" value={passport.market.holders.toLocaleString()} />}
            </div>
          )}

          {/* The agent's trades here, with why */}
          <section className="mt-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-grey">Your agent here</h2>
            {trades.length === 0 ? (
              <p className="text-sm text-grey">Your agent hasn&apos;t traded this yet.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line">
                {trades.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0">
                    <span className={`mt-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${t.side === "buy" ? "bg-[#DDF3E7] text-[#157E4E]" : t.side === "sell" ? "bg-[#FBE3D8] text-[#B93A16]" : "bg-card text-grey"}`}>{t.side.toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink">{t.notionalUsd != null ? usd(t.notionalUsd) : `${t.inAmount} → ${t.outAmount}`}{t.tokenPriceUsd != null ? <span className="text-grey"> at {fmtPrice(t.tokenPriceUsd)}</span> : null}</span>
                      {t.reason && <span className="block truncate text-xs text-grey">&ldquo;{t.reason}&rdquo; · {t.source}</span>}
                    </span>
                    <span className="text-right text-xs text-grey">
                      {timeAgo(t.at)}<br />
                      <a href={`https://solscan.io/tx/${t.tx}`} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">tx</a>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right rail: position and tell your agent */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-card p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-grey">Your position</span>
              {position?.openedAt && <span className="text-[11px] text-grey">since {timeAgo(position.openedAt)}</span>}
            </div>
            {qty == null ? (
              <div className="mt-2 text-sm text-grey">Loading…</div>
            ) : qty > 0 ? (
              <>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-semibold tracking-tight">{usd(value)}</span>
                  <span className={`text-sm font-medium ${tone(pnl)}`}>{pnl == null ? "" : `${pnl >= 0 ? "+" : "−"}${usd(Math.abs(pnl))} · ${pnlPct != null ? `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%` : ""}`}</span>
                </div>
                <div className="mt-1 text-xs text-grey">{qty.toLocaleString(undefined, { maximumFractionDigits: qty < 1 ? 6 : 2 })} {symbol}</div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <dt className="text-grey">Avg entry</dt><dd className="text-right text-ink">{position?.avgEntryUsd != null ? fmtPrice(position.avgEntryUsd) : "—"}</dd>
                  <dt className="text-grey">Invested</dt><dd className="text-right text-ink">{position ? usd(position.investedUsd) : "—"}</dd>
                  <dt className="text-grey">Realized</dt><dd className={`text-right ${tone(position?.realizedUsd)}`}>{position ? usd(position.realizedUsd) : "—"}</dd>
                  <dt className="text-grey">Trades</dt><dd className="text-right text-ink">{position ? position.buys + position.sells : 0}</dd>
                </dl>
                {position?.openedBy && <p className="mt-3 text-xs text-grey">Opened by: &ldquo;{position.openedBy}&rdquo;</p>}
              </>
            ) : (
              <div className="mt-2 text-sm text-grey">You don&apos;t hold any {symbol}.{position?.closed ? ` Closed with ${usd(position.realizedUsd)} realized.` : ""}</div>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-[#FFFFFF] p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-grey">Tell your agent</div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {[10, 25, 50, 100].map((n) => (
                <button key={n} type="button" disabled={!!busy} onClick={() => tell(`buy $${n} of ${symbol} (${mint})`)} className="rounded-xl bg-ink py-2 text-sm font-semibold text-cream transition hover:bg-coral-deep disabled:opacity-40">${n}</button>
              ))}
            </div>
            <form className="mt-2 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); const n = Number(custom); if (n > 0) tell(`buy $${n} of ${symbol} (${mint})`); }}>
              <input inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Any amount, $" className="min-w-0 flex-1 rounded-xl border border-line bg-cream px-3 py-2 text-sm focus:border-ink focus:outline-none" />
              <button type="submit" disabled={!!busy || !(Number(custom) > 0)} className="rounded-xl px-3 py-2 text-sm font-medium text-ink shadow-[inset_0_0_0_1px_#D5D1C5] transition hover:bg-ink hover:text-cream disabled:opacity-40">Buy</button>
            </form>
            {qty != null && qty > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button type="button" disabled={!!busy} onClick={() => tell(`sell half of my ${symbol} (${mint})`)} className="rounded-xl py-2 text-sm font-medium text-ink shadow-[inset_0_0_0_1px_#D5D1C5] transition hover:bg-ink hover:text-cream disabled:opacity-40">Sell half</button>
                <button type="button" disabled={!!busy} onClick={() => tell(`sell all of my ${symbol} (${mint})`)} className="rounded-xl py-2 text-sm font-medium text-coral-text shadow-[inset_0_0_0_1px_#D5D1C5] transition hover:bg-coral hover:text-cream disabled:opacity-40">Sell all</button>
              </div>
            )}
            <p className="mt-2 text-[11px] text-grey">Goes through your agent: same allowance, same rules as chat. It quotes first; nothing moves until it says so.</p>
            {busy && <p className="mt-2 text-xs text-grey">Asking… &ldquo;{busy}&rdquo;</p>}
            {reply && <div className="mt-2 rounded-xl border border-line bg-card px-3 py-2 text-sm"><MessageText text={reply} /></div>}
            <Link href="/chat" className="mt-2 block text-xs text-grey underline underline-offset-2 hover:text-ink">Or say it your own way in chat →</Link>
          </div>

          {stats && (stats.websites.length > 0 || stats.socials.length > 0) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {stats.websites.slice(0, 2).map((w) => <a key={w} href={w} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1 text-grey shadow-[inset_0_0_0_1px_#D5D1C5] hover:text-ink">site ↗</a>)}
              {stats.socials.slice(0, 3).map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1 text-grey shadow-[inset_0_0_0_1px_#D5D1C5] hover:text-ink">{s.type} ↗</a>)}
              <a href={`https://x.com/search?q=${encodeURIComponent(symbol.startsWith("$") ? symbol : `$${symbol}`)}`} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1 text-grey shadow-[inset_0_0_0_1px_#D5D1C5] hover:text-ink">search on X ↗</a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/** The passport and the guards, in one line under the header. */
function TrustLine({ p, stats }: { p: Passport; stats: TokenStats | null }) {
  const v = p.verdict;
  const bad = v === "impersonator";
  const backed = v === "backed" || v === "issuer-claimed";
  const label = bad ? "Impersonator: your agent won't buy this" : backed ? `${v === "backed" ? "Backed" : "Issuer-claimed"}${p.issuer?.name ? ` · ${p.issuer.name}` : ""}` : v === "meme" ? "No claim of backing" : v;
  const bits: string[] = [];
  if (p.market?.liquidityUsd != null) bits.push(`${fmtMc(p.market.liquidityUsd)} liquidity`);
  if (stats?.createdAt) bits.push(`${timeAgo(stats.createdAt).replace(" ago", "")} old`);
  if (p.market?.launchpad) bits.push(p.market.launchpad);
  if (p.market?.verifiedOnJupiter) bits.push("on Jupiter's verified list");
  const thin = !bad && !backed && p.market?.liquidityUsd != null && p.market.liquidityUsd < 100_000;
  return (
    <div className={`mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2 text-xs ${bad ? "bg-[#FBE3D8] text-[#B93A16]" : backed ? "bg-[#DDF3E7] text-[#157E4E]" : "bg-card text-grey"}`}>
      <span className="font-medium">{bad ? "✕" : backed ? "✓" : "○"} {label}</span>
      {bits.length > 0 && <span>{bits.join(" · ")}</span>}
      {thin && <span className="text-[#B93A16]">Under $100K liquidity: budget can&apos;t buy this; your own money can.</span>}
      {!bad && !backed && !thin && <span>Budget can hold up to a quarter here.</span>}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 text-center">
      <div className="text-[11px] uppercase tracking-wider text-grey">{label}</div>
      <div className="text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function Bar({ label, a, bLabel, b }: { label: string; a: number; bLabel: string; b: number }) {
  const tot = a + b || 1;
  return (
    <div className="col-span-2 rounded-xl border border-line bg-card px-3 py-2">
      <div className="flex justify-between text-xs"><span><b className="text-ink">{a.toLocaleString()}</b> <span className="text-grey">{label}</span></span><span><b className="text-ink">{b.toLocaleString()}</b> <span className="text-grey">{bLabel}</span></span></div>
      <div className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <span className="bg-[#157E4E]" style={{ width: `${(a / tot) * 100}%` }} />
        <span className="bg-[#E8542E]" style={{ width: `${(b / tot) * 100}%` }} />
      </div>
    </div>
  );
}
