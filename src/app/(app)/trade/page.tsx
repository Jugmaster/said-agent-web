"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import { useAgent } from "@/hooks/useAgent";
import { useSendableBalance } from "@/hooks/useSendableBalance";
import { requestRefresh } from "@/lib/refresh";
import { agentTrade } from "@/lib/api";
import { isMint } from "@/lib/marketdata";
import {
  TOKENS,
  type TokenKey,
  type JupQuote,
  getQuote,
  toBaseUnits,
  fromBaseUnits,
} from "@/lib/jupiter";

export default function TradePage() {
  return <AuthGate>{(platformId) => <TradeInner platformId={platformId} />}</AuthGate>;
}

function CaSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const valid = isMint(value);
  function go() {
    if (valid) router.push(`/trade/${value.trim()}`);
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 focus-within:border-zinc-600">
      <span className="text-zinc-600">⌕</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.trim())}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder="Paste a token contract address…"
        className="min-w-0 flex-1 bg-transparent font-mono text-sm text-white placeholder-zinc-600 focus:outline-none"
      />
      <button
        type="button"
        onClick={go}
        disabled={!valid}
        className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        View
      </button>
    </div>
  );
}

function TradeInner({ platformId }: { platformId: string }) {
  const agent = useAgent();
  const walletAddress = agent.status === "ready" ? agent.walletAddress : null;

  const bal = useSendableBalance(walletAddress);

  const [fromKey, setFromKey] = useState<TokenKey>("SOL");
  const [toKey, setToKey] = useState<TokenKey>("USDC");
  const [amount, setAmount] = useState("");

  const [quote, setQuote] = useState<JupQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);

  const [executing, setExecuting] = useState(false);
  const [execErr, setExecErr] = useState<string | null>(null);
  const [sig, setSig] = useState<string | null>(null);

  const from = TOKENS[fromKey];
  const to = TOKENS[toKey];
  const amountNum = parseFloat(amount);
  const fromBalance = fromKey === "SOL" ? bal.sol : bal.usdc;

  function flip() {
    setFromKey(toKey);
    setToKey(fromKey);
    setAmount("");
    setQuote(null);
    setQuoteErr(null);
    setSig(null);
  }

  // Debounced quote whenever the pair or amount changes.
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setSig(null);
    setExecErr(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setQuote(null);
      setQuoteErr(null);
      return;
    }
    setQuoting(true);
    setQuoteErr(null);
    debounce.current = setTimeout(async () => {
      try {
        const q = await getQuote({
          inputMint: from.mint,
          outputMint: to.mint,
          amount: toBaseUnits(amountNum, from.decimals),
          slippageBps: 100,
        });
        setQuote(q);
      } catch (e) {
        setQuote(null);
        setQuoteErr(e instanceof Error ? e.message : "Couldn't get a quote");
      } finally {
        setQuoting(false);
      }
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [amountNum, from.mint, to.mint, from.decimals]);

  const execute = useCallback(async () => {
    if (!quote) return;
    setExecuting(true);
    setExecErr(null);
    setSig(null);
    try {
      const r = await agentTrade({
        platformId,
        inputMint: from.mint,
        outputMint: to.mint,
        amount: amountNum,
        inputDecimals: from.decimals,
      });
      if (r.ok && r.signature) {
        setSig(r.signature);
        setAmount("");
        setQuote(null);
        requestRefresh();
        bal.refetch();
      } else {
        setExecErr(r.message || "Swap failed");
      }
    } catch (e) {
      setExecErr(e instanceof Error ? e.message : "Swap failed");
    } finally {
      setExecuting(false);
    }
  }, [quote, platformId, from.mint, to.mint, amountNum, from.decimals, bal]);

  const outUi = quote ? fromBaseUnits(quote.outAmount, to.decimals) : null;
  const rate = quote && amountNum > 0 && outUi != null ? outUi / amountNum : null;
  const priceImpact = quote ? parseFloat(quote.priceImpactPct) * 100 : null;
  const overBalance = Number.isFinite(amountNum) && amountNum > fromBalance;

  return (
    <div className="mt-24 md:mt-0 md:pt-10 px-5 md:px-8 pb-[calc(var(--tabbar-h)+1.5rem)] md:pb-16 w-full max-w-md mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-white">Trade</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Paste a token address to see its chart and buy it — or quick-swap below.
        </p>
      </div>

      <CaSearch />

      <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-wide text-zinc-600">
        <div className="h-px flex-1 bg-zinc-800" />
        quick swap
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <>
          {/* You pay */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>You pay</span>
              <span>
                Balance: {fromBalance.toFixed(from.decimals === 9 ? 4 : 2)} {from.symbol}
                <button
                  type="button"
                  onClick={() => setAmount(String(fromBalance))}
                  className="ml-2 text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
                >
                  Max
                </button>
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <input
                inputMode="decimal"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className="min-w-0 flex-1 bg-transparent text-2xl font-semibold text-white placeholder-zinc-600 focus:outline-none"
              />
              <span className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm font-semibold text-zinc-200">
                {from.symbol}
              </span>
            </div>
          </div>

          {/* Flip */}
          <div className="my-2 flex justify-center">
            <button
              type="button"
              onClick={flip}
              className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition"
              aria-label="Flip tokens"
            >
              ↓↑
            </button>
          </div>

          {/* You receive */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-xs text-zinc-500">You receive (estimated)</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="min-w-0 flex-1 text-2xl font-semibold text-white">
                {quoting ? (
                  <span className="text-zinc-600">…</span>
                ) : outUi != null ? (
                  outUi.toLocaleString(undefined, { maximumFractionDigits: 6 })
                ) : (
                  <span className="text-zinc-600">0.0</span>
                )}
              </div>
              <span className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm font-semibold text-zinc-200">
                {to.symbol}
              </span>
            </div>
          </div>

          {/* Quote details */}
          {rate != null && (
            <div className="mt-3 space-y-1 rounded-xl border border-zinc-800/70 bg-zinc-900/30 px-4 py-3 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Rate</span>
                <span className="text-zinc-300">
                  1 {from.symbol} ≈ {rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {to.symbol}
                </span>
              </div>
              {priceImpact != null && (
                <div className="flex justify-between">
                  <span>Price impact</span>
                  <span className={priceImpact > 1 ? "text-amber-400" : "text-zinc-300"}>
                    {priceImpact < 0.01 ? "<0.01" : priceImpact.toFixed(2)}%
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Slippage</span>
                <span className="text-zinc-300">1%</span>
              </div>
            </div>
          )}

          {quoteErr && <p className="mt-3 text-xs text-red-400">{quoteErr}</p>}
          {overBalance && (
            <p className="mt-3 text-xs text-amber-400">
              Amount exceeds your {from.symbol} balance.
            </p>
          )}

          <button
            type="button"
            disabled={!quote || executing || overBalance}
            onClick={execute}
            className="mt-5 w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {executing ? "Swapping…" : "Swap"}
          </button>

          {execErr && <p className="mt-3 text-xs text-red-400">{execErr}</p>}

          {sig && (
            <div className="mt-5 rounded-2xl border border-emerald-800/50 bg-gradient-to-b from-emerald-950/40 to-zinc-950 px-5 py-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-300">
                ✓
              </div>
              <div className="text-lg font-semibold text-white">Swap sent</div>
              <a
                href={`https://solscan.io/tx/${sig}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
              >
                View on Solscan ↗
              </a>
            </div>
          )}
        </>
    </div>
  );
}
