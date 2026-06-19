const fs = require("fs");
const path = require("path");
const root = "C:/forestbond-clone/web/src";
function w(rel, c) { fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true}); fs.writeFileSync(path.join(root,rel), c.trimStart(), "utf8"); console.log("w", rel); }

w("hooks/useLiveCharts.ts", `"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BondMessage, DualBondRow } from "@/lib/types";

export type LinePoint = { time: number; value: number };
export type CandlePoint = { time: number; open: number; high: number; low: number; close: number };
export type HistPoint = { time: number; value: number; color?: string };

const MAX_POINTS = 240;

function toNum(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function yieldToPrice(yieldPct: number) {
  return Math.round((1000 - yieldPct * 100) * 100) / 100;
}

function bucketKey(ts: number, sec = 30) {
  return Math.floor(ts / sec) * sec;
}

function pickRow(rows: DualBondRow[], prefer?: string) {
  if (prefer) {
    const hit = rows.find((r) => r.bondCD === prefer || r.bondCD?.startsWith(prefer));
    if (hit) return hit;
  }
  return rows.find((r) => toNum(r.privateEval) != null) ?? rows[0];
}

function pushCandle(candles: CandlePoint[], ts: number, price: number): CandlePoint[] {
  const key = bucketKey(ts);
  const next = [...candles];
  const last = next[next.length - 1];
  if (last && last.time === key) {
    last.high = Math.max(last.high, price);
    last.low = Math.min(last.low, price);
    last.close = price;
    return next.slice(-MAX_POINTS);
  }
  next.push({ time: key, open: price, high: price, low: price, close: price });
  return next.slice(-MAX_POINTS);
}

function pushLine(lines: LinePoint[], ts: number, value: number): LinePoint[] {
  const next = [...lines, { time: ts, value }];
  return next.slice(-MAX_POINTS);
}

function pushVolume(vols: HistPoint[], ts: number, amount: number): HistPoint[] {
  const key = bucketKey(ts);
  const next = [...vols];
  const last = next[next.length - 1];
  if (last && last.time === key) {
    last.value += amount;
    return next.slice(-MAX_POINTS);
  }
  next.push({ time: key, value: amount, color: "#64748b" });
  return next.slice(-MAX_POINTS);
}

export function useLiveCharts(govRows: DualBondRow[], monRows: DualBondRow[], messages: BondMessage[]) {
  const [gov3y, setGov3y] = useState<{ line: LinePoint[]; candles: CandlePoint[]; volume: HistPoint[]; last?: DualBondRow }>({ line: [], candles: [], volume: [] });
  const [gov10y, setGov10y] = useState<{ line: LinePoint[]; candles: CandlePoint[]; volume: HistPoint[]; last?: DualBondRow }>({ line: [], candles: [], volume: [] });
  const [monMain, setMonMain] = useState<{ line: LinePoint[]; candles: CandlePoint[]; volume: HistPoint[]; last?: DualBondRow }>({ line: [], candles: [], volume: [] });
  const prevGov = useRef<{ a?: number; b?: number; m?: number }>({});

  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    const row3 = pickRow(govRows, "24-");
    const row10 = pickRow(govRows, "23-10") ?? pickRow(govRows, "16-");
    const rowMon = pickRow(monRows);

    const apply = (
      row: DualBondRow | undefined,
      setter: typeof setGov3y,
      prevKey: "a" | "b" | "m"
    ) => {
      const y = row ? toNum(row.privateEval) : null;
      if (y == null || !row) return;
      if (prevGov.current[prevKey] === y) return;
      prevGov.current[prevKey] = y;
      const price = yieldToPrice(y);
      setter((s) => ({
        last: row,
        line: pushLine(s.line, now, y),
        candles: pushCandle(s.candles, now, price),
        volume: s.volume,
      }));
    };

    apply(row3, setGov3y, "a");
    apply(row10, setGov10y, "b");
    apply(rowMon, setMonMain, "m");
  }, [govRows, monRows]);

  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    const govMsgs = messages.filter((m) => m.category === "gov").length;
    const monMsgs = messages.filter((m) => m.category === "mon").length;
    if (govMsgs > 0) {
      setGov3y((s) => ({ ...s, volume: pushVolume(s.volume, now, 1) }));
      setGov10y((s) => ({ ...s, volume: pushVolume(s.volume, now, 1) }));
    }
    if (monMsgs > 0) setMonMain((s) => ({ ...s, volume: pushVolume(s.volume, now, 1) }));
  }, [messages]);

  const yieldCurve = useMemo(() => {
    const seen = new Set<string>();
    const pts: LinePoint[] = [];
    govRows.forEach((r, i) => {
      const y = toNum(r.privateEval);
      if (y == null || !r.bondCD || seen.has(r.bondCD)) return;
      seen.add(r.bondCD);
      pts.push({ time: i + 1, value: y });
    });
    return pts.slice(0, 20);
  }, [govRows]);

  return { gov3y, gov10y, monMain, yieldCurve };
}
`);

w("components/charts/LiveChart.tsx", `"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import type { CandlePoint, HistPoint, LinePoint } from "@/hooks/useLiveCharts";

type Props = {
  line?: LinePoint[];
  candles?: CandlePoint[];
  volume?: HistPoint[];
  height?: number;
  mode?: "line" | "candle" | "combo";
};

export function LiveChart({ line = [], candles = [], volume = [], height = 200, mode = "combo" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const chart = createChart(hostRef.current, {
      height,
      layout: { background: { type: ColorType.Solid, color: "#ffffff" }, textColor: "#333" },
      grid: { vertLines: { color: "#eef2f7" }, horzLines: { color: "#eef2f7" } },
      rightPriceScale: { borderColor: "#cbd5e1" },
      timeScale: { borderColor: "#cbd5e1", timeVisible: true, secondsVisible: true },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;

    if (mode === "line" || mode === "combo") {
      lineRef.current = chart.addSeries(LineSeries, {
        color: "#2563eb",
        lineWidth: 2,
        priceFormat: { type: "price", precision: 3, minMove: 0.001 },
      });
    }
    if (mode === "candle" || mode === "combo") {
      candleRef.current = chart.addSeries(CandlestickSeries, {
        upColor: "#dc2626",
        downColor: "#2563eb",
        borderUpColor: "#dc2626",
        borderDownColor: "#2563eb",
        wickUpColor: "#dc2626",
        wickDownColor: "#2563eb",
      });
    }
    if (volume.length && (mode === "candle" || mode === "combo")) {
      volRef.current = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
      });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    }

    const ro = new ResizeObserver(() => {
      if (hostRef.current) chart.applyOptions({ width: hostRef.current.clientWidth });
    });
    ro.observe(hostRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [height, mode]);

  useEffect(() => {
    if (lineRef.current && line.length) {
      lineRef.current.setData(line.map((p) => ({ time: p.time as never, value: p.value })));
    }
  }, [line]);

  useEffect(() => {
    if (candleRef.current && candles.length) {
      candleRef.current.setData(candles.map((p) => ({ time: p.time as never, open: p.open, high: p.high, low: p.low, close: p.close })));
      chartRef.current?.timeScale().scrollToRealTime();
    }
  }, [candles]);

  useEffect(() => {
    if (volRef.current && volume.length) {
      volRef.current.setData(volume.map((p) => ({ time: p.time as never, value: p.value, color: p.color })));
    }
  }, [volume]);

  return <div className="live-chart" ref={hostRef} />;
}
`);

console.log("batch1 ok");
