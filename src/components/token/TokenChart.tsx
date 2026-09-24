"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, LineSeries, CandlestickSeries, HistogramSeries, createSeriesMarkers, type IChartApi, type ISeriesApi, type SeriesMarker, type Time, type UTCTimestamp } from "lightweight-charts";
import { getOhlcv, type Candle, type Timeframe, type TradeRow } from "@/lib/api";

const TFS: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

/**
 * The token's price with the agent's buys and sells drawn on it. MC or price
 * on the axis (memecoins are read in MC); line or candles; the markers carry
 * the fill and the reason as the marker text.
 */
export default function TokenChart({
  mint,
  pool,
  trades,
  supply,
  defaultTf = "15m",
}: {
  mint: string;
  pool: string | null;
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

  // Read the candles for the timeframe.
  useEffect(() => {
    let alive = true;
    setLoading(true); setErr(null);
    getOhlcv(mint, tf, { pool, limit: 400 })
      .then((r) => { if (!alive) return; setCandles(r.candles); if (!r.candles.length) setErr("No chart for this token yet."); })
      .catch(() => alive && setErr("Chart unavailable."))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [mint, tf, pool]);

  // Build the chart once.
  useEffect(() => {
    if (!host.current) return;
    const chart = createChart(host.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#8A867B", fontFamily: "inherit", attributionLogo: false },
      grid: { vertLines: { color: "rgba(23,22,19,0.05)" }, horzLines: { color: "rgba(23,22,19,0.05)" } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      crosshair: { horzLine: { labelBackgroundColor: "#171613" }, vertLine: { labelBackgroundColor: "#171613" } },
      handleScale: { axisPressedMouseMove: true },
      autoSize: true,
    });
    chartRef.current = chart;
    return () => { chart.remove(); chartRef.current = null; seriesRef.current = null; volRef.current = null; };
  }, []);

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

    const vol = chart.addSeries(HistogramSeries, { priceScaleId: "vol", color: "rgba(23,22,19,0.12)", priceFormat: { type: "volume" }, lastValueVisible: false, priceLineVisible: false });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    vol.setData(candles.map((c) => ({ time: c[0] as UTCTimestamp, value: c[5], color: c[4] >= c[1] ? "rgba(21,126,78,0.18)" : "rgba(185,58,22,0.18)" })));
    volRef.current = vol;

    let series: ISeriesApi<"Line"> | ISeriesApi<"Candlestick">;
    if (mode === "candles") {
      const s = chart.addSeries(CandlestickSeries, { upColor: "#157E4E", downColor: "#B93A16", wickUpColor: "#157E4E", wickDownColor: "#B93A16", borderVisible: false, priceFormat });
      s.setData(candles.map((c) => ({ time: c[0] as UTCTimestamp, open: c[1] * k, high: c[2] * k, low: c[3] * k, close: c[4] * k })));
      series = s;
    } else {
      const s = chart.addSeries(LineSeries, { color: "#171613", lineWidth: 2, priceFormat, lastValueVisible: true, crosshairMarkerRadius: 4 });
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
          color: t.side === "buy" ? "#157E4E" : "#E8542E",
          shape: t.side === "buy" ? "arrowUp" : "arrowDown",
          text: `${t.side === "buy" ? "B" : "S"} ${t.notionalUsd != null ? `$${t.notionalUsd.toFixed(0)}` : ""}`.trim(),
        } as SeriesMarker<Time>;
      })
      .sort((a, b) => (a.time as number) - (b.time as number));
    createSeriesMarkers(series, markers);
    chart.timeScale().fitContent();
  }, [candles, mode, axis, supply, trades]);

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

export function fmtMc(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}
export function fmtPrice(v: number): string {
  if (v >= 1) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  if (v <= 0) return "$0";
  // 0.0₄2783 style for dust prices: count the zeros after the point.
  const s = v.toFixed(12).replace(/0+$/, "");
  const m = s.match(/^0\.(0*)(\d+)$/);
  if (!m) return `$${v}`;
  const zeros = m[1].length;
  const digits = m[2].slice(0, 4);
  return zeros >= 3 ? `$0.0${SUB[zeros] ?? zeros}${digits}` : `$${v.toFixed(zeros + 4)}`;
}
const SUB = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉", "₁₀", "₁₁"];
