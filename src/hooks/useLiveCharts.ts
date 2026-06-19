"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { BondMessage, DualBondRow } from "@/lib/types";

export type LinePoint = { time: number; value: number };
export type CandlePoint = { time: number; open: number; high: number; low: number; close: number };
export type HistPoint = { time: number; value: number; color?: string };

const MAX_POINTS = 240;
const GOV_3Y_CODES = ["25-4", "24-11", "24-5", "24-"];
const GOV_10Y_CODES = ["24-3", "23-10", "16-", "15-"];

function toNum(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function yieldToPrice(yieldPct: number) {
  return Math.round((1000 - yieldPct * 100) * 100) / 100;
}

function bucketKey(ts: number, sec = 15) {
  return Math.floor(ts / sec) * sec;
}

function pickRow(rows: DualBondRow[], prefers: string[] = []) {
  for (const prefer of prefers) {
    const hit = rows.find((r) => r.bondCD === prefer || r.bondCD?.startsWith(prefer));
    if (hit && toNum(hit.privateEval) != null) return hit;
  }
  return rows.find((r) => toNum(r.privateEval) != null) ?? rows[0];
}

function rowSignature(row?: DualBondRow) {
  if (!row) return "";
  return [row.bondCD, row.privateEval, row.tradeTime, row.action, row.additionInfo?.split("\n")[0]].join("|");
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

type SeriesState = {
  line: LinePoint[];
  candles: CandlePoint[];
  volume: HistPoint[];
  last?: DualBondRow;
  lastSig?: string;
};

function applyRow(
  setter: Dispatch<SetStateAction<SeriesState>>,
  row: DualBondRow | undefined,
  ts: number,
  force = false
) {
  const y = row ? toNum(row.privateEval) : null;
  if (y == null || !row) return;
  const sig = rowSignature(row);
  setter((s) => {
    if (!force && s.lastSig === sig) return s;
    const price = yieldToPrice(y);
    const hasTrade = row.action === "buy" || row.action === "sell";
    return {
      last: row,
      lastSig: sig,
      line: pushLine(s.line, ts, y),
      candles: pushCandle(s.candles, ts, price),
      volume: hasTrade ? pushVolume(s.volume, ts, 1) : s.volume,
    };
  });
}

export function useLiveCharts(govRows: DualBondRow[], monRows: DualBondRow[], messages: BondMessage[]) {
  const [gov3y, setGov3y] = useState<SeriesState>({ line: [], candles: [], volume: [] });
  const [gov10y, setGov10y] = useState<SeriesState>({ line: [], candles: [], volume: [] });
  const [monMain, setMonMain] = useState<SeriesState>({ line: [], candles: [], volume: [] });

  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    applyRow(setGov3y, pickRow(govRows, GOV_3Y_CODES), now);
    applyRow(setGov10y, pickRow(govRows, GOV_10Y_CODES), now);
    applyRow(setMonMain, pickRow(monRows), now);
  }, [govRows, monRows]);

  useEffect(() => {
    if (messages.length === 0) return;
    const now = Math.floor(Date.now() / 1000);
    const latestGov = messages.find((m) => m.category === "gov");
    const latestMon = messages.find((m) => m.category === "mon");
    if (latestGov) {
      setGov3y((s) => ({ ...s, volume: pushVolume(s.volume, now, 1) }));
      setGov10y((s) => ({ ...s, volume: pushVolume(s.volume, now, 1) }));
    }
    if (latestMon) setMonMain((s) => ({ ...s, volume: pushVolume(s.volume, now, 1) }));
  }, [messages.length, messages[0]?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      applyRow(setGov3y, pickRow(govRows, GOV_3Y_CODES), now, true);
      applyRow(setGov10y, pickRow(govRows, GOV_10Y_CODES), now, true);
      applyRow(setMonMain, pickRow(monRows), now, true);
    }, 5000);
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
