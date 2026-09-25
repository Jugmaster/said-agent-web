"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, LineSeries, CandlestickSeries, HistogramSeries, createSeriesMarkers, type IChartApi, type ISeriesApi, type SeriesMarker, type Time, type UTCTimestamp } from "lightweight-charts";
import { getOhlcv, type Candle, type Timeframe, type TradeRow } from "@/lib/api";
import { fmtMc, fmtPrice } from "./format";

const TFS: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

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
      getOhlcv(mint, tf, { pool, limit: 400 })
        .then((r) => {
          if (!alive) return;
          if (r.candles.length) { setCandles(r.candles); setLoading(false); return; }
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
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      crosshair: { horzLine: { labelBackgroundColor: ink }, vertLine: { labelBackgroundColor: ink } },
      handleScale: { axisPressedMouseMove: true },
      autoSize: true,
    });
    chartRef.current = chart;
    return () => { chart.remove(); chartRef.current = null; seriesRef.current = null; volRef.current = null; };
  }, [themeKey]);

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

    // The agent's fills, snapped to the candle they fell in.
    const first = candles[0][0];
    const step = candles.length > 1 ? candles[1][0] - candles[0][0] : 60;
    const markers: SeriesMarker<Time>[] = trades
      .filter((t) => t.side === "buy" || t.side === "sell")
      .map((t) => {
        const ts = Math.floor(new Date(t.at.endsWith("Z") ? t.at : t.at + "Z").getTime() / 1000);
        const snapped = Math.max(first, first + Math.floor((ts - first) / step) * step);
        return {
          time: snapped as UTCTimestamp,
          position: t.side === "buy" ? "belowBar" : "aboveBar",
          color: t.side === "buy" ? up : css("--color-coral", "#E8542E"),
          shape: t.side === "buy" ? "arrowUp" : "arrowDown",
          text: `${t.side === "buy" ? "B" : "S"} ${t.notionalUsd != null ? `$${t.notionalUsd.toFixed(0)}` : ""}`.trim(),
        } as SeriesMarker<Time>;
      })
      .sort((a, b) => (a.time as number) - (b.time as number));
    createSeriesMarkers(series, markers);
    chart.timeScale().fitContent();
  }, [candles, mode, axis, supply, trades, themeKey]);

  return (
    <div>
      <div className="relative h-[300px] w-full md:h-[380px]">
        <div ref={host} className="absolute inset-0" />
        {(loading || err) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-grey">{err ?? "Loading chart…"}</div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex gap-1">
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
