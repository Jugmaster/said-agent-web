import type { IChartApi, ISeriesApi, ISeriesPrimitive, IPrimitivePaneRenderer, IPrimitivePaneView, SeriesAttachedParameter, SeriesType, Time, UTCTimestamp } from "lightweight-charts";

export interface FillMark { time: UTCTimestamp; price: number; side: "buy" | "sell"; label?: string; notionalUsd?: number | null; tokenPriceUsd?: number | null; at?: string; reason?: string | null; tx?: string; agentDecided?: boolean }
export interface Hit { mark: FillMark; x: number; y: number }

interface MediaSpace { context: CanvasRenderingContext2D; mediaSize: { width: number; height: number } }
interface Target { useMediaCoordinateSpace: (fn: (scope: MediaSpace) => void) => void }

/**
 * The agent's fills as lettered circles on the price line: green B for a
 * buy, coral S for a sell. A series primitive, so it scrolls, zooms and
 * re-themes with the chart.
 */
export class TradeMarkers implements ISeriesPrimitive<Time> {
  private chart: IChartApi | null = null;
  private series: ISeriesApi<SeriesType> | null = null;
  private requestUpdate: (() => void) | null = null;
  private marks: FillMark[] = [];
  private hits: Hit[] = [];
  private colors = { up: "#157E4E", down: "#E8542E", text: "#FFFFFF" };
  private view: IPrimitivePaneView;

  constructor() {
    const self = this;
    const renderer: IPrimitivePaneRenderer = {
      draw(target: unknown) {
        (target as Target).useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
          if (!self.chart || !self.series) return;
          const ts = self.chart.timeScale();
          self.hits = [];
          const seen = new Map<number, number>(); // fills on the same candle fan out sideways
          for (const m of self.marks) {
            const x0 = ts.timeToCoordinate(m.time);
            const y = self.series!.priceToCoordinate(m.price);
            if (x0 == null || y == null || x0 < -12 || x0 > mediaSize.width + 12) continue;
            const k = seen.get(m.time as number) ?? 0; seen.set(m.time as number, k + 1);
            const x = x0 + k * 14;
            const r = 9;
            self.hits.push({ mark: m, x, y });
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = m.side === "buy" ? self.colors.up : self.colors.down;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "rgba(255,255,255,0.85)";
            ctx.stroke();
            ctx.fillStyle = self.colors.text;
            ctx.font = "700 10px system-ui, -apple-system, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(m.side === "buy" ? "B" : "S", x, y + 0.5);
          }
        });
      },
    };
    this.view = { zOrder: () => "top", renderer: () => renderer };
  }

  attached(p: SeriesAttachedParameter<Time>): void {
    this.chart = p.chart;
    this.series = p.series as ISeriesApi<SeriesType>;
    this.requestUpdate = p.requestUpdate;
  }
  detached(): void { this.chart = null; this.series = null; this.requestUpdate = null; }
  paneViews(): readonly IPrimitivePaneView[] { return [this.view]; }
  updateAllViews(): void {}

  setMarks(marks: FillMark[]): void { this.marks = marks; this.requestUpdate?.(); }
  /** The bubble under a point in the chart's media coordinates, if any. */
  bubbleAt(x: number, y: number): Hit | null {
    let best: Hit | null = null; let bd = 12;
    for (const h of this.hits) { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h; } }
    return best;
  }
  setColors(c: { up: string; down: string; text?: string }): void { this.colors = { ...this.colors, ...c }; this.requestUpdate?.(); }
}
