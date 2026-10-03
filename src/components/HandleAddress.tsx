"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getHandleWallet, type HandleWallet } from "@/lib/api";
import s from "@/app/landing.module.css";

/**
 * The address card on a handle's page: where money addressed to this handle
 * lands, from any app. Public when it exists. Creating one for a handle that
 * has none needs a signed-in caller, so a script cannot mint wallets.
 */
export default function HandleAddress({ handle }: { handle: string }) {
  const { ready, authenticated, login } = usePrivy();
  const [w, setW] = useState<HandleWallet | null | undefined>(undefined);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getHandleWallet(handle).then((r) => { if (r.ok) setW(r.wallet); else { setW(null); setHint(r.hint ?? null); } }).catch(() => setW(null));
  }, [handle]);

  const create = async () => {
    if (!authenticated) { login(); return; }
    setBusy(true);
    try {
      const r = await getHandleWallet(handle, "x", { create: true });
      if (r.ok) setW(r.wallet); else setHint(r.error ?? r.hint ?? "Couldn't create it right now.");
    } finally { setBusy(false); }
  };
  const copy = async () => { if (!w) return; try { await navigator.clipboard.writeText(w.wallet); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };

  if (w === undefined) return null;
  return (
    <section style={{ marginTop: 40 }} data-reveal>
      <p className={s.eyebrow}>Where money for @{handle} lands</p>
      {w ? (
        <div className={s.list} style={{ maxWidth: 640 }}>
          <div className={s.rowItem}>
            <span className={s.rowAvatar}>@</span>
            <span style={{ minWidth: 0 }}>
              <span className={s.rowName} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.9rem", wordBreak: "break-all" }}>{w.wallet}</span>
              <span className={s.rowMeta}>Solana · {w.claimed ? "claimed: this account has signed in" : "waiting: theirs the moment they sign in with this account"}{w.verified ? " · verified on SAID" : ""}</span>
            </span>
            <span className={s.rowRight}><button type="button" onClick={copy} className={s.pill}>{copied ? "Copied" : "Copy"}</button></span>
          </div>
          <p className={s.pageSub} style={{ fontSize: "0.92rem", marginTop: 12 }}>
            Anything can pay this address: a friend, a tip, a token&apos;s creator-fee split, a UsePaid claim. It belongs to the {w.platform === "x" ? "X" : "Telegram"} account that owns @{handle}, not to whoever sent it, and it comes with an agent that can trade it.
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: 640 }}>
          <p className={s.pageSub} style={{ fontSize: "0.95rem" }}>{hint ?? `No address exists for @${handle} yet. Create one and it's theirs the moment they sign in with X.`}</p>
          {!hint && (
            <div className={s.ctas} style={{ marginTop: 14 }}>
              <button type="button" className={`${s.btn} ${s.ghost}`} onClick={create} disabled={!ready || busy}>
                {busy ? "Creating…" : authenticated ? `Create an address for @${handle}` : "Sign in to create their address"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
