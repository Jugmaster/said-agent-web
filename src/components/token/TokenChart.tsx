"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, LineSeries, CandlestickSeries, HistogramSeries, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { getOhlcv, type Candle, type Timeframe, type TradeRow } from "@/lib/api";
import { TradeMarkers, type FillMark, type Hit } from "./trade-markers";
import { fmtMc, fmtPrice } from "./format";

const TFS: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

/** "6 weeks", "212 days", for the footer. */
function spanLabel(c: Candle[]): string {
  if (c.length < 2) return "";
  const days = (c[c.length - 1][0] - c[0][0]) / 86_400;
  if (days < 2) return `${Math.round(days * 24)}h`;
  if (days < 60) return `${Math.round(days)} days`;
  if (days < 730) return `${Math.round(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}

/** Candles strictly ascending by time, one per timestamp (the feed occasionally repeats one; the chart refuses it). */
function tidy(list: Candle[]): Candle[] {
  const by = new Map<number, Candle>();
  for (const c of list) by.set(c[0], c);
  return [...by.values()].sort((a, b) => a[0] - b[0]);
}

/** A theme token's current value, so the canvas matches the page in both themes. */
const css = (name: string, fallback: string) => (typeof window === "undefined" ? fallback : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback);
const rgba = (hex: string, a: number) => { const m = hex.replace("#", ""); const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16); return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`; };

/**
 * The token's price with the agent's buys and sells drawn on it. MC or price
 * on the axis (memecoins are read in MC); line or candles; the markers carry
 * the fill and the reason as the marker text.
 */
export default function TokenChart({
  mint,
  pool,
  ready,
  trades,
  supply,
  defaultTf = "15m",
}: {
  mint: string;
  /** The top pool once stats are known; null when the token has none. */
  pool: string | null;
  /** False until the stats lookup has finished, so the chart asks once, with the pool. */
  ready: boolean;
  trades: TradeRow[];
  supply: number | null;
  defaultTf?: Timeframe;
}) {
  const host = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [tf, setTf] = useState<Timeframe>(defaultTf);
  const [mode, setMode] = useState<"line" | "candles">("line");
  const [axis, setAxis] = useState<"mc" | "price">(supply && supply > 0 ? "mc" : "price");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  // Paging back through history as the user scrolls left.
  const [hasMore, setHasMore] = useState(true);
  const loadingMore = useRef(false);
  const MAX_PAGES = 24;
  const pagesRef = useRef(0);
  const candlesRef = useRef<Candle[]>([]);
  candlesRef.current = candles;
  const prependedRef = useRef(false);
  const markersRef = useRef<TradeMarkers | null>(null);
  const [hover, setHover] = useState<Hit | null>(null);
  // Re-theme when the page does (toggle or OS).
  const [themeKey, setThemeKey] = useState(0);
  useEffect(() => {
    const bump = () => setThemeKey((k) => k + 1);
    const mo = new MutationObserver(bump);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", bump);
    return () => { mo.disconnect(); mq.removeEventListener("change", bump); };
  }, []);

  // Read the candles for the timeframe: once the pool is known, one request,
  // and a short retry when the upstream is rate-limited.
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    setLoading(true); setErr(null);
    const ask = (attempt: number) => {
      setHasMore(true);
      pagesRef.current = 0;
      getOhlcv(mint, tf, { pool, limit: 1000 })
        .then((r) => {
          if (!alive) return;
          if (r.candles.length) { setCandles(tidy(r.candles)); setHasMore(r.candles.length >= 1000); setLoading(false); return; }
          if (r.retryIn && attempt < 3) { setErr("Busy, trying again…"); timer = setTimeout(() => ask(attempt + 1), r.retryIn * 1000); return; }
          setCandles([]); setErr("No chart for this token yet."); setLoading(false);
        })
        .catch(() => { if (alive) { setErr("Chart unavailable."); setLoading(false); } });
    };
    ask(0);
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [mint, tf, pool, ready]);

  // Build the chart once.
  useEffect(() => {
    if (!host.current) return;
    const ink = css("--color-ink", "#171613");
    const grey = css("--color-grey", "#6F6B62");
    const chart = createChart(host.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: grey, fontFamily: "inherit", attributionLogo: false },
      grid: { vertLines: { color: rgba(ink, 0.06) }, horzLines: { color: rgba(ink, 0.06) } },
      rightPriceScale: { borderVisible: false },
      // No scrolling into the future past the last candle, or into the void before the first.
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, fixRightEdge: true, fixLeftEdge: true, rightOffset: 0, lockVisibleTimeRangeOnResize: true },
      crosshair: { horzLine: { labelBackgroundColor: ink }, vertLine: { labelBackgroundColor: ink } },
      handleScale: { axisPressedMouseMove: true },
      autoSize: true,
    });
    chartRef.current = chart;
    return () => { chart.remove(); chartRef.current = null; seriesRef.current = null; volRef.current = null; };
  }, [themeKey]);

  // Older candles when the left edge comes into view.
  const loadOlder = async () => {
    if (loadingMore.current || !hasMore) return;
    const first = candlesRef.current[0];
    if (!first) return;
    loadingMore.current = true;
    try {
      const r = await getOhlcv(mint, tf, { pool, limit: 1000, before: first[0] });
      if (r.retryIn && r.candles.length === 0) { setTimeout(() => { loadingMore.current = false; void loadOlder(); }, r.retryIn * 1000); return; }
      // The page is inclusive of `before`, so one candle overlaps; judge "more" by the raw page size.
      const older = r.candles.filter((c) => c[0] < first[0]);
      if (older.length === 0) { setHasMore(false); return; }
      const chart = chartRef.current;
      const range = chart?.timeScale().getVisibleRange();
      prependedRef.current = true;
      setCandles((cur) => tidy([...older, ...cur]));
      pagesRef.current += 1;
      if (r.candles.length < 1000 || pagesRef.current >= MAX_PAGES) setHasMore(false);
      // Keep the user where they were; setData would otherwise jump to the end.
      if (chart && range) requestAnimationFrame(() => { try { chart.timeScale().setVisibleRange(range); } catch {} });
    } finally {
      loadingMore.current = false;
    }
  };
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const onRange = (r: { from: number; to: number } | null) => { if (r && r.from < 40) void loadOlder(); };
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRange);
    return () => chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeKey, tf, pool, hasMore]);

  // History without dragging: once the first page is up, keep pulling older
  // pages in the background, paced under the feed's limit, up to MAX_PAGES.
  useEffect(() => {
    if (loading || !hasMore || candles.length === 0) return;
    let alive = true;
    const t = setTimeout(async () => {
      if (!alive) return;
      await loadOlder();
    }, 2200);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, loading, hasMore]);

  // (Re)draw the series when data, mode or axis changes.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (seriesRef.current) { chart.removeSeries(seriesRef.current); seriesRef.current = null; }
    if (volRef.current) { chart.removeSeries(volRef.current); volRef.current = null; }
    if (!candles.length) return;
    const k = axis === "mc" && supply ? supply : 1;
    const fmt = (v: number) => (axis === "mc" ? fmtMc(v) : fmtPrice(v));
    const priceFormat = { type: "custom" as const, formatter: fmt, minMove: 1e-12 };

    const ink = css("--color-ink", "#171613"), up = css("--color-up", "#157E4E"), down = css("--color-down", "#B93A16");
    const vol = chart.addSeries(HistogramSeries, { priceScaleId: "vol", color: rgba(ink, 0.12), priceFormat: { type: "volume" }, lastValueVisible: false, priceLineVisible: false });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    vol.setData(candles.map((c) => ({ time: c[0] as UTCTimestamp, value: c[5], color: c[4] >= c[1] ? rgba(up, 0.2) : rgba(down, 0.2) })));
    volRef.current = vol;

    let series: ISeriesApi<"Line"> | ISeriesApi<"Candlestick">;
    if (mode === "candles") {
      const s = chart.addSeries(CandlestickSeries, { upColor: up, downColor: down, wickUpColor: up, wickDownColor: down, borderVisible: false, priceFormat });
      s.setData(candles.map((c) => ({ time: c[0] as UTCTimestamp, open: c[1] * k, high: c[2] * k, low: c[3] * k, close: c[4] * k })));
      series = s;
    } else {
      const s = chart.addSeries(LineSeries, { color: ink, lineWidth: 2, priceFormat, lastValueVisible: true, crosshairMarkerRadius: 4 });
      s.setData(candles.map((c) => ({ time: c[0] as UTCTimestamp, value: c[4] * k })));
      series = s;
    }
    seriesRef.current = series;

    // The agent's fills as lettered circles, snapped to the candle they fell in, on that candle's close.
    const first = candles[0][0];
    const step = candles.length > 1 ? candles[1][0] - candles[0][0] : 60;
    const byTime = new Map<number, Candle>(candles.map((c) => [c[0], c]));
    const marks: FillMark[] = trades
      .filter((t) => t.side === "buy" || t.side === "sell")
      .map((t) => {
        const ts = Math.floor(new Date(t.at.endsWith("Z") ? t.at : t.at + "Z").getTime() / 1000);
        const snapped = Math.max(first, first + Math.floor((ts - first) / step) * step);
        const c = byTime.get(snapped);
        const price = (t.tokenPriceUsd ?? c?.[4] ?? 0) * k;
        return { time: snapped as UTCTimestamp, price, side: t.side as "buy" | "sell", notionalUsd: t.notionalUsd, tokenPriceUsd: t.tokenPriceUsd, at: t.at, reason: t.reason, tx: t.tx };
      })
      .filter((m) => m.price > 0);
    const prim = new TradeMarkers();
    prim.setColors({ up, down: css("--color-coral", "#E8542E") });
    series.attachPrimitive(prim);
    prim.setMarks(marks);
    markersRef.current = prim;
    setHover(null);
    if (!prependedRef.current) chart.timeScale().fitContent();
    prependedRef.current = false;
  }, [candles, mode, axis, supply, trades, themeKey]);

  return (
    <div>
      <div
        className="relative h-[300px] w-full md:h-[380px]"
        onMouseMove={(e) => {
          const el = host.current; const prim = markersRef.current;
          if (!el || !prim) return;
          const r = el.getBoundingClientRect();
          setHover(prim.bubbleAt(e.clientX - r.left, e.clientY - r.top));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <div ref={host} className="absolute inset-0" />
        {hover && <FillCard hit={hover} />}
        {(loading || err) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-grey">{err ?? "Loading chart…"}</div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1">
          {candles.length > 0 && <span className="mr-1 text-grey">{hasMore ? `loading history… ${spanLabel(candles)}` : `${spanLabel(candles)} of history`}</span>}
          {TFS.map((x) => (
            <button key={x} type="button" onClick={() => setTf(x)} className={`rounded-full px-2.5 py-1 transition ${tf === x ? "bg-ink text-cream" : "text-grey hover:text-ink"}`}>{x}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {supply && supply > 0 && (
            <>
              <button type="button" onClick={() => setAxis("mc")} className={`rounded-full px-2.5 py-1 transition ${axis === "mc" ? "bg-ink text-cream" : "text-grey hover:text-ink"}`}>MC</button>
              <button type="button" onClick={() => setAxis("price")} className={`rounded-full px-2.5 py-1 transition ${axis === "price" ? "bg-ink text-cream" : "text-grey hover:text-ink"}`}>Price</button>
              <span className="mx-1 text-line">·</span>
            </>
          )}
          <button type="button" onClick={() => setMode("line")} className={`rounded-full px-2.5 py-1 transition ${mode === "line" ? "bg-ink text-cream" : "text-grey hover:text-ink"}`}>Line</button>
          <button type="button" onClick={() => setMode("candles")} className={`rounded-full px-2.5 py-1 transition ${mode === "candles" ? "bg-ink text-cream" : "text-grey hover:text-ink"}`}>Candles</button>
        </div>
      </div>
    </div>
  );
}

/** What the agent did there: side, size, price, when, and why. Sits beside the bubble. */
function FillCard({ hit }: { hit: Hit }) {
  const m = hit.mark;
  const left = hit.x + 16;
  const flip = typeof window !== "undefined" && left > (document.body.clientWidth ?? 9999) - 260;
  const when = m.at ? new Date(m.at.endsWith("Z") ? m.at : m.at + "Z").toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <div
      className="pointer-events-none absolute z-20 w-56 rounded-xl border border-line bg-paper p-3 text-xs shadow-[0_12px_30px_-8px_rgba(var(--shadow-rgb),0.25)]"
      style={{ left: flip ? undefined : left, right: flip ? `calc(100% - ${hit.x - 16}px)` : undefined, top: Math.max(8, hit.y - 44) }}
    >
      <div className="flex items-baseline justify-between">
        <span className={`font-semibold ${m.side === "buy" ? "text-up" : "text-down"}`}>{m.side === "buy" ? "Bought" : "Sold"}{m.notionalUsd != null ? ` $${m.notionalUsd.toFixed(2)}` : ""}</span>
        <span className="text-grey">{when}</span>
      </div>
      {m.tokenPriceUsd != null && <div className="mt-1 text-ink">at {fmtPrice(m.tokenPriceUsd)}</div>}
      {m.reason && <div className="mt-1 text-grey">&ldquo;{m.reason.length > 90 ? m.reason.slice(0, 90) + "…" : m.reason}&rdquo;</div>}
    </div>
  );
}
