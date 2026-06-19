"use client";

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
      chartRef.current?.timeScale().scrollToRealTime();
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
