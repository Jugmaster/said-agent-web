"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import TokenChart, { type ChartPoint } from "@/components/TokenChart";
import { agentTrade } from "@/lib/api";
import {
  getToken,
  getPriceSeries,
  fmtUsdCompact,
  TIMEFRAMES,
  type Timeframe,
  type TokenMeta,
  type Point,
} from "@/lib/marketdata";
import {
  TOKENS,
  type JupQuote,
  getQuote,
  toBaseUnits,
  fromBaseUnits,
} from "@/lib/jupiter";

const SOL = TOKENS.SOL;

export default function TokenPage() {
  const params = useParams<{ mint: string }>();
  const mint = params?.mint ?? "";
  return <AuthGate>{(platformId) => <TokenInner mint={mint} platformId={platformId} />}</AuthGate>;
}

function TokenInner({ mint, platformId }: { mint: string; platformId: string }) {

  const [meta, setMeta] = useState<TokenMeta | null>(null);
  const [metaErr, setMetaErr] = useState<string | null>(null);
  const [tf, setTf] = useState<Timeframe>("ALL");
  const [series, setSeries] = useState<Point[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  // Load token metadata once per mint.
  useEffect(() => {
    let live = true;
    setMeta(null);
    setMetaErr(null);
    getToken(mint)
      .then((m) => {
        if (!live) return;
        if (!m) setMetaErr("Token not found on Solana.");
        else setMeta(m);
      })
      .catch(() => live && setMetaErr("Couldn't load this token."));
    return () => {
      live = false;
    };
  }, [mint]);

  // Load the price series on mint / timeframe / pool change.
  useEffect(() => {
    if (!meta?.topPool) {
      setSeries([]);
      setChartLoading(false);
      return;
    }
    let live = true;
    setChartLoading(true);
    getPriceSeries(meta.topPool, tf)
      .then((s) => live && setSeries(s))
      .catch(() => live && setSeries([]))
      .finally(() => live && setChartLoading(false));
    return () => {
      live = false;
    };
  }, [meta?.topPool, tf]);

  // Market-cap line (MC ≈ price × supply); fall back to raw price if no supply.
  const usingMc = meta?.supply != null && meta.supply > 0;
  const chartPoints: ChartPoint[] = series.map((p) => ({
    t: p.t,
    value: usingMc ? p.price * (meta!.supply as number) : p.price,
  }));
  const firstV = chartPoints[0]?.value;
  const lastV = chartPoints[chartPoints.length - 1]?.value;
  const changePct = firstV && lastV ? ((lastV - firstV) / firstV) * 100 : null;
  const headlineMc = meta?.marketCapUsd ?? (lastV ?? null);

  return (
    <div className="mt-24 md:mt-0 md:pt-8 px-4 md:px-8 pb-[calc(var(--tabbar-h)+1.5rem)] md:pb-16 w-full max-w-2xl mx-auto">
      <Link href="/trade" className="text-xs text-zinc-500 hover:text-zinc-300">
        ← Trade
      </Link>

      {metaErr ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-8 text-center text-sm text-zinc-400">
          {metaErr}
          <div className="mt-1 font-mono text-xs text-zinc-600 break-all">{mint}</div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mt-3 flex items-center gap-3">
            {meta?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={meta.imageUrl} alt={meta.symbol} className="h-11 w-11 rounded-full bg-zinc-800 object-cover" />
            ) : (
              <div className="h-11 w-11 rounded-full bg-zinc-800" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-white">{meta?.symbol ?? "…"}</span>
                <span className="truncate text-xs text-zinc-500">{meta?.name}</span>
              </div>
              <CopyCA mint={mint} />
            </div>
            <div className="ml-auto text-right">
              <div className="text-lg font-semibold text-white">{fmtUsdCompact(headlineMc)}{usingMc ? " MC" : ""}</div>
              {changePct != null && (
                <div className={changePct >= 0 ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
                  {changePct >= 0 ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3">
            <TokenChart
              points={chartPoints}
              label={lastV != null ? fmtUsdCompact(lastV) : undefined}
              loading={chartLoading && chartPoints.length === 0}
            />
            <div className="mt-3 flex gap-1">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTf(t)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    tf === t ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Trade panel */}
          {meta ? <TradePanel meta={meta} platformId={platformId} /> : null}
        </>
      )}
    </div>
  );
}

function CopyCA({ mint }: { mint: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(mint).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      className="mt-0.5 font-mono text-xs text-zinc-500 hover:text-zinc-300"
      title="Copy contract address"
    >
      {mint.slice(0, 4)}…{mint.slice(-4)} {copied ? "✓" : "⧉"}
    </button>
  );
}

function TradePanel({ meta, platformId }: { meta: TokenMeta; platformId: string }) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<JupQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [sig, setSig] = useState<string | null>(null);

  // Buy = spend SOL for the token; Sell = sell the token for SOL.
  const payDecimals = side === "buy" ? SOL.decimals : meta.decimals;
  const inputMint = side === "buy" ? SOL.mint : meta.address;
  const outputMint = side === "buy" ? meta.address : SOL.mint;
  const outDecimals = side === "buy" ? meta.decimals : SOL.decimals;
  const amountNum = parseFloat(amount);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setSig(null);
    setErr(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setQuote(null);
      return;
    }
    setQuoting(true);
    debounce.current = setTimeout(async () => {
      try {
        const q = await getQuote({
          inputMint,
          outputMint,
          amount: toBaseUnits(amountNum, payDecimals),
          slippageBps: 150,
        });
        setQuote(q);
      } catch (e) {
        setQuote(null);
        setErr(e instanceof Error ? e.message : "No quote");
      } finally {
        setQuoting(false);
      }
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [amountNum, inputMint, outputMint, payDecimals]);

  const execute = useCallback(async () => {
    if (!quote) return;
    setExecuting(true);
    setErr(null);
    try {
      const r = await agentTrade({
        platformId,
        inputMint,
        outputMint,
        amount: amountNum,
        inputDecimals: payDecimals,
      });
      if (r.ok && r.signature) {
        setSig(r.signature);
        setAmount("");
        setQuote(null);
      } else {
        setErr(r.message || "Swap failed");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Swap failed");
    } finally {
      setExecuting(false);
    }
  }, [quote, platformId, inputMint, outputMint, amountNum, payDecimals]);

  const out = quote ? fromBaseUnits(quote.outAmount, outDecimals) : null;
  const payLabel = side === "buy" ? "SOL" : meta.symbol;
  const getLabel = side === "buy" ? meta.symbol : "SOL";

  return (
    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { setSide("buy"); setAmount(""); setQuote(null); setSig(null); }}
          className={`rounded-lg py-2 text-sm font-semibold transition ${
            side === "buy" ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-600/40" : "bg-zinc-950 text-zinc-400"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => { setSide("sell"); setAmount(""); setQuote(null); setSig(null); }}
          className={`rounded-lg py-2 text-sm font-semibold transition ${
            side === "sell" ? "bg-red-500/20 text-red-300 ring-1 ring-red-600/40" : "bg-zinc-950 text-zinc-400"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
        <input
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          className="min-w-0 flex-1 bg-transparent text-xl font-semibold text-white placeholder-zinc-600 focus:outline-none"
        />
        <span className="text-sm font-semibold text-zinc-300">{payLabel}</span>
      </div>

      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>You receive</span>
        <span className="text-zinc-300">
          {quoting ? "…" : out != null ? `${out.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${getLabel}` : `— ${getLabel}`}
        </span>
      </div>

      {err && <p className="mt-2 text-xs text-red-400 break-words">{err}</p>}

      <button
        type="button"
        disabled={!quote || executing}
        onClick={execute}
        className={`mt-3 w-full rounded-xl py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 ${
          side === "buy" ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-red-500 text-black hover:bg-red-400"
        }`}
      >
        {executing ? "Confirming…" : side === "buy" ? `Buy ${meta.symbol}` : `Sell ${meta.symbol}`}
      </button>

      {sig && (
        <a
          href={`https://solscan.io/tx/${sig}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-center text-xs font-medium text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
        >
          Trade sent — view on Solscan ↗
        </a>
      )}
    </div>
  );
}
