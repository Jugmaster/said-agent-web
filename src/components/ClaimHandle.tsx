"use client";

import { useEffect, useRef, useState } from "react";
import { checkHandle, claimHandle, getHandle, HANDLE_REASONS, type HandleInfo } from "@/lib/api";

/**
 * Your @name on Atcha: shows it, or claims it. Suggests your X or Telegram
 * name when it's free. Checks availability as you type. Used on the Level
 * page and in Settings; `compact` is the one-line form for the card.
 */
export default function ClaimHandle({ platformId, compact = false, onClaimed }: { platformId: string; compact?: boolean; onClaimed?: (handle: string) => void }) {
  const [info, setInfo] = useState<HandleInfo | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [check, setCheck] = useState<{ ok: boolean; reason?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    getHandle(platformId).then((i) => { if (!alive) return; setInfo(i); if (i && !i.handle) { setEditing(true); setValue(i.suggestion ?? ""); } }).catch(() => alive && setInfo(null));
    return () => { alive = false; };
  }, [platformId]);

  useEffect(() => {
    if (!editing) return;
    const v = value.trim().replace(/^@+/, "").toLowerCase();
    setCheck(null);
    if (v.length < 3) return;
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => checkHandle(v).then((c) => c && setCheck({ ok: c.ok, reason: c.reason })), 300);
    return () => { if (t.current) clearTimeout(t.current); };
  }, [value, editing]);

  if (info === undefined) return <div className="text-xs text-grey">…</div>;
  if (info === null) return <div className="text-xs text-grey">Names arrive with the next update.</div>;

  const claim = async () => {
    setBusy(true); setNote(null);
    const r = await claimHandle(platformId, value);
    if (!r) setNote("Couldn't reach the butler.");
    else if (r.ok) { setInfo({ ...info, handle: r.handle }); setEditing(false); setNote(r.renamed ? `Renamed to @${r.handle}.` : `@${r.handle} is yours.`); onClaimed?.(r.handle); }
    else setNote(r.reason ? HANDLE_REASONS[r.reason] : "Couldn't claim that.");
    setBusy(false);
  };

  if (!editing && info.handle) {
    return (
      <div className={compact ? "flex items-center justify-between gap-3" : ""}>
        <div>
          <div className="text-sm text-ink">@{info.handle}</div>
          {!compact && <div className="text-xs text-grey">Your name on Atcha. Pay @{info.handle}, atcha.cash/@{info.handle}.</div>}
        </div>
        <button type="button" onClick={() => { setEditing(true); setValue(info.handle ?? ""); }} className="text-xs text-grey underline underline-offset-2 hover:text-ink">Change</button>
        {note && <p className="mt-1 text-xs text-ink">{note}</p>}
      </div>
    );
  }

  const v = value.trim().replace(/^@+/, "").toLowerCase();
  const canClaim = v.length >= 3 && check?.ok === true && !busy;
  return (
    <div>
      {!compact && <div className="mb-1.5 text-sm font-medium text-ink">{info.handle ? "Change your name" : "Pick your name"}</div>}
      <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); if (canClaim) claim(); }}>
        <div className="relative min-w-0 flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none text-grey">@</span>
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={info.suggestion ?? "yourname"} autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={21} className="w-full rounded-xl border border-line bg-cream py-2 pl-7 pr-3 text-sm focus:border-ink focus:outline-none" />
        </div>
        <button type="submit" disabled={!canClaim} className="rounded-xl bg-ink px-3.5 py-2 text-sm font-semibold text-cream transition hover:bg-coral-deep disabled:opacity-40">{busy ? "…" : info.handle ? "Rename" : "Claim"}</button>
        {info.handle && <button type="button" onClick={() => setEditing(false)} className="rounded-xl px-3 py-2 text-sm text-grey hover:text-ink">Cancel</button>}
      </form>
      <p className={`mt-1.5 text-xs ${check?.ok === false ? "text-[#B93A16]" : "text-grey"}`}>
        {v.length < 3 ? "3 to 20 characters: letters, digits, underscore. One change a month." : check == null ? "Checking…" : check.ok ? `@${v} is free.` : (check.reason && HANDLE_REASONS[check.reason as keyof typeof HANDLE_REASONS]) || "Not available."}
      </p>
      {note && <p className="mt-1 text-xs text-ink">{note}</p>}
    </div>
  );
}
