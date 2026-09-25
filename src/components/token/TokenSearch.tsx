"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchTokens, type TokenHit } from "@/lib/api";
import { fmtMc } from "./format";

/** Look up any Solana token by name, symbol or mint; opens its page. */
export default function TokenSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<TokenHit[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q.trim())) { setHits([]); return; }
    const t = setTimeout(() => searchTokens(q.trim()).then((h) => { setHits(h); setOpen(true); }), 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <div ref={box} className="relative w-full max-w-xs">
      <form onSubmit={(e) => { e.preventDefault(); const s = q.trim(); if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) router.push(`/token/${s}`); else if (hits[0]) router.push(`/token/${hits[0].mint}`); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => hits.length && setOpen(true)} placeholder="Look up a token: name or mint" className="w-full rounded-full border border-line bg-paper px-3.5 py-2 text-sm placeholder:text-grey focus:border-ink focus:outline-none" />
      </form>
      {open && hits.length > 0 && (
        <div className="absolute right-0 top-11 z-40 w-[22rem] max-w-[90vw] overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_18px_50px_-8px_rgba(23,22,19,0.12)]">
          {hits.map((h) => (
            <button key={h.mint} type="button" onClick={() => { setOpen(false); setQ(""); router.push(`/token/${h.mint}`); }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-card">
              {h.imageUrl ? <img src={h.imageUrl} alt="" className="h-7 w-7 rounded-full bg-card object-cover" /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-[10px] font-semibold">{h.symbol.slice(0, 3)}</span>}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{h.symbol} <span className="text-grey">{h.name}</span></span>
                <span className="block text-xs text-grey">{h.marketCapUsd != null ? `${fmtMc(h.marketCapUsd)} MC` : ""}{h.liquidityUsd != null ? ` · ${fmtMc(h.liquidityUsd)} liq` : ""}</span>
              </span>
              {h.change24h != null && <span className={`text-xs ${h.change24h >= 0 ? "text-up" : "text-down"}`}>{h.change24h >= 0 ? "+" : ""}{h.change24h.toFixed(1)}%</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
