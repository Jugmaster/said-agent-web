"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import AppPage from "@/components/AppPage";
import { launchCoin, getAtchaLaunches, type LaunchRecord, type LaunchResult } from "@/lib/api";

const FIELD = "w-full rounded-xl border border-line bg-card px-4 py-3 text-ink placeholder:text-grey focus:border-ring focus:outline-none";

function LaunchScreen({ platformId }: { platformId: string }) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [cashback, setCashback] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageErr, setImageErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<LaunchResult | null>(null);
  const [mine, setMine] = useState<LaunchRecord[]>([]);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [quote, setQuote] = useState("SAID");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => getAtchaLaunches(platformId).then((r) => { setMine(r.launches); setEnabled(r.enabled); setQuote(r.quote); });
  useEffect(() => { void load(); }, [platformId]); // eslint-disable-line react-hooks/exhaustive-deps

  const tick = symbol.trim().replace(/^\$/, "").toUpperCase();
  const valid = name.trim().length > 0 && /^[A-Z0-9]{2,10}$/.test(tick) && !!image;

  function pick(f: File | undefined) {
    setImageErr(null);
    if (!f) return;
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(f.type)) { setImageErr("PNG, JPG, GIF or WebP."); return; }
    if (f.size > 4_000_000) { setImageErr("Under 4 MB, please."); return; }
    const r = new FileReader();
    r.onload = () => setImage(String(r.result));
    r.readAsDataURL(f);
  }

  async function go() {
    if (!valid || busy) return;
    setBusy(true); setConfirming(false); setResult(null);
    const r = await launchCoin({ platformId, name: name.trim(), symbol: tick, description: description.trim() || undefined, imageBase64: image!, twitter: twitter.trim() || undefined, website: website.trim() || undefined, cashback });
    setResult(r); setBusy(false);
    if (r.ok) { setName(""); setSymbol(""); setDescription(""); setTwitter(""); setWebsite(""); setImage(null); void load(); }
  }

  return (
    <AppPage title="Launch" sub={`Launch a coin from your agent. Every coin on Atcha is paired with $${quote}: buys route through it and fees are paid in it.`} narrow>
      {enabled === false && (
        <div className="mb-5 rounded-xl border border-line bg-card px-4 py-3 text-sm text-grey">Launching isn&apos;t switched on yet. You can fill this in; it opens soon.</div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5">
        <div className="flex gap-4">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-ring bg-paper text-xs text-grey hover:border-ink">
            {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : "Add image"}
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <input className={FIELD} placeholder="Name" maxLength={32} value={name} onChange={(e) => setName(e.target.value)} />
            <input className={FIELD} placeholder="Ticker" maxLength={11} value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
          </div>
        </div>
        {imageErr && <p className="text-xs text-down">{imageErr}</p>}
        <textarea className={`${FIELD} min-h-20`} placeholder="What it is (optional)" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={FIELD} placeholder="X link (optional)" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
          <input className={FIELD} placeholder="Website (optional)" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1 text-xs uppercase tracking-wider text-grey">Trading fees</legend>
          <label className="flex items-start gap-2"><input type="radio" name="fee" checked={!cashback} onChange={() => setCashback(false)} className="mt-1" /><span><span className="text-ink">1% to you</span> <span className="text-grey">as the creator, paid in ${quote}</span></span></label>
          <label className="flex items-start gap-2"><input type="radio" name="fee" checked={cashback} onChange={() => setCashback(true)} className="mt-1" /><span><span className="text-ink">Cashback</span> <span className="text-grey">fees go back to the people trading it</span></span></label>
        </fieldset>
        <p className="text-xs text-grey">Paired with ${quote}. Your agent pays the network fee, about 0.025 SOL. Up to 3 launches a day.</p>
        {!confirming ? (
          <button type="button" disabled={!valid || busy || enabled === false} onClick={() => setConfirming(true)} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cream disabled:opacity-40">
            {busy ? "Launching…" : "Launch"}
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-xl border border-ring bg-paper p-4 text-sm">
            <p className="text-ink">Launch <b>${tick}</b> ({name.trim()}) paired with ${quote}? This is public and can&apos;t be undone.</p>
            <div className="flex gap-2">
              <button type="button" onClick={go} className="rounded-full bg-coral px-5 py-2 text-sm font-semibold text-cream">Launch it</button>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-full border border-line px-5 py-2 text-sm text-grey">Cancel</button>
            </div>
          </div>
        )}
        {result && (result.ok ? (
          <div className="rounded-xl border border-line bg-paper p-4 text-sm">
            <p className="text-ink">${result.symbol} is live, paired with ${result.quoteSymbol}.</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href={`/token/${result.mint}`} className="text-coral-text underline">Open its page</Link>
              <a href={result.pumpUrl} target="_blank" rel="noreferrer" className="text-coral-text underline">pump.fun</a>
              <a href={`https://solscan.io/tx/${result.tx}`} target="_blank" rel="noreferrer" className="text-grey underline">Transaction</a>
            </div>
          </div>
        ) : <p className="text-sm text-down">{result.error}</p>)}
      </div>

      {mine.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-grey">Your launches</h2>
          <div className="flex flex-col gap-2">
            {mine.map((l) => (
              <Link key={l.mint} href={`/token/${l.mint}`} className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 hover:border-ring">
                <span><span className="text-sm font-semibold text-ink">${l.symbol}</span> <span className="text-xs text-grey">{l.name}</span></span>
                <span className="text-xs text-grey">/{l.quoteSymbol} · {l.createdAt.slice(0, 10)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </AppPage>
  );
}

export default function LaunchPage() {
  return <AuthGate>{(platformId) => <LaunchScreen platformId={platformId} />}</AuthGate>;
}
