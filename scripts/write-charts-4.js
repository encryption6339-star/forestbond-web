const fs = require("fs");

// Fix volume increment + heartbeat for live chart movement
const hook = `use client";

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

type SeriesState = { line: LinePoint[]; candles: CandlePoint[]; volume: HistPoint[]; last?: DualBondRow; lastYield?: number };

function applyYield(setter: React.Dispatch<React.SetStateAction<SeriesState>>, row: DualBondRow | undefined, ts: number, force = false) {
  const y = row ? toNum(row.privateEval) : null;
  if (y == null || !row) return;
  setter((s) => {
    if (!force && s.lastYield === y) return s;
    const price = yieldToPrice(y);
    return {
      last: row,
      lastYield: y,
      line: pushLine(s.line, ts, y),
      candles: pushCandle(s.candles, ts, price),
      volume: s.volume,
    };
  });
}

export function useLiveCharts(govRows: DualBondRow[], monRows: DualBondRow[], messages: BondMessage[]) {
  const [gov3y, setGov3y] = useState<SeriesState>({ line: [], candles: [], volume: [] });
  const [gov10y, setGov10y] = useState<SeriesState>({ line: [], candles: [], volume: [] });
  const [monMain, setMonMain] = useState<SeriesState>({ line: [], candles: [], volume: [] });
  const lastMsgId = useRef<number | null>(null);

  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    applyYield(setGov3y, pickRow(govRows, "24-"), now);
    applyYield(setGov10y, pickRow(govRows, "23-10") ?? pickRow(govRows, "16-"), now);
    applyYield(setMonMain, pickRow(monRows), now);
  }, [govRows, monRows]);

  useEffect(() => {
    const id = messages[0]?.id;
    if (id == null || id === lastMsgId.current) return;
    lastMsgId.current = id;
    const now = Math.floor(Date.now() / 1000);
    const cat = messages[0]?.category;
    if (cat === "gov") {
      setGov3y((s) => ({ ...s, volume: pushVolume(s.volume, now, 1) }));
      setGov10y((s) => ({ ...s, volume: pushVolume(s.volume, now, 1) }));
    }
    if (cat === "mon") setMonMain((s) => ({ ...s, volume: pushVolume(s.volume, now, 1) }));
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      applyYield(setGov3y, pickRow(govRows, "24-"), now, true);
      applyYield(setGov10y, pickRow(govRows, "23-10") ?? pickRow(govRows, "16-"), now, true);
      applyYield(setMonMain, pickRow(monRows), now, true);
    }, 15000);
    return () => clearInterval(timer);
  }, [govRows, monRows]);

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
`.replace('use client";', '"use client";');

fs.writeFileSync("C:/forestbond-clone/web/src/hooks/useLiveCharts.ts", hook, "utf8");

// Fix FuturesChartPanel price color (Korean: red=up)
const panel = fs.readFileSync("C:/forestbond-clone/web/src/components/dashboard/widgets/FuturesChartPanel.tsx", "utf8")
  .replace(
    `function fmtChange(line: LinePoint[]) {
  if (line.length < 2) return { delta: 0, pct: 0 };
  const a = line[line.length - 2].value;
  const b = line[line.length - 1].value;
  return { delta: b - a, pct: a ? ((b - a) / a) * 100 : 0 };
}`,
    `function fmtPriceChange(candles: CandlePoint[]) {
  if (candles.length < 2) return 0;
  return candles[candles.length - 1].close - candles[candles.length - 2].close;
}`
  )
  .replace(
    `  const y = lastRow?.privateEval != null ? Number(lastRow.privateEval) : line.at(-1)?.value;
  const { delta } = fmtChange(line);
  const price = candles.at(-1)?.close;
  const up = delta <= 0;`,
    `  const y = lastRow?.privateEval != null ? Number(lastRow.privateEval) : line.at(-1)?.value;
  const delta = fmtPriceChange(candles);
  const price = candles.at(-1)?.close;
  const up = delta >= 0;`
  )
  .replace(
    `{delta !== 0 ? \`\${delta > 0 ? "+" : ""}\${delta.toFixed(3)}\` : "0.000"}`,
    `{delta !== 0 ? \`\${delta > 0 ? "+" : ""}\${delta.toFixed(2)}\` : "0.00"}`
  );
fs.writeFileSync("C:/forestbond-clone/web/src/components/dashboard/widgets/FuturesChartPanel.tsx", panel, "utf8");

// LiveChart scroll on line update too
const live = fs.readFileSync("C:/forestbond-clone/web/src/components/charts/LiveChart.tsx", "utf8")
  .replace(
    `  useEffect(() => {
    if (lineRef.current && line.length) {
      lineRef.current.setData(line.map((p) => ({ time: p.time as never, value: p.value })));
    }
  }, [line]);`,
    `  useEffect(() => {
    if (lineRef.current && line.length) {
      lineRef.current.setData(line.map((p) => ({ time: p.time as never, value: p.value })));
      chartRef.current?.timeScale().scrollToRealTime();
    }
  }, [line]);`
  );
fs.writeFileSync("C:/forestbond-clone/web/src/components/charts/LiveChart.tsx", live, "utf8");

console.log("patched charts");
