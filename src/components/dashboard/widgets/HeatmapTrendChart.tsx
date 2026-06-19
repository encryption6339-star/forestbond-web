"use client";

import { useEffect, useState } from "react";
import { LiveChart } from "@/components/charts/LiveChart";
import type { LinePoint } from "@/hooks/useLiveCharts";

type StatsDay = { matrix?: number[][]; bucketTotals?: number[] };

export function HeatmapTrendChart() {
  const [points, setPoints] = useState<LinePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/heatmapapi/data/stats.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { days?: Record<string, StatsDay> }) => {
        const days = Object.keys(data.days ?? {}).sort().slice(-30);
        const pts = days.map((day) => {
          const entry = data.days?.[day];
          const total = entry?.bucketTotals?.reduce((a, b) => a + b, 0)
            ?? entry?.matrix?.flat().reduce((a, b) => a + (b || 0), 0)
            ?? 0;
          return { time: Math.floor(new Date(day).getTime() / 1000), value: total };
        });
        setPoints(pts);
      })
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="chart-panel terminal-widget">
      <div className="chart-panel-header">
        <div>
          <div className="chart-panel-title">호가 활동 추세 (일별)</div>
          <div className="chart-panel-sub">Heatmap API stats.json</div>
        </div>
      </div>
      {loading ? <div className="empty-state">차트 로딩...</div> : <LiveChart line={points} height={220} mode="line" />}
    </div>
  );
}
