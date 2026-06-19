"use client";

import { useEffect, useState } from "react";
import type { HeatmapData } from "@/lib/types";
import { fetchHeatmap } from "@/lib/heatmap-api";
import { heatColor, todayIso } from "@/lib/utils";

export function HeatmapMiniWidget() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmap(todayIso())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="terminal-widget"><div className="empty-state">히트맵 로딩...</div></div>;
  if (!data?.matrix?.length) return <div className="terminal-widget"><div className="empty-state">히트맵 데이터 없음</div></div>;

  const max = Math.max(...data.matrix.flat(), 1);
  return (
    <div className="terminal-widget">
      <div className="terminal-widget-header">잔존만기별 히트맵 ({data.asof ?? todayIso()})</div>
      <div className="heatmap-mini-scroll">
        <table className="heatmap-mini-table">
          <thead>
            <tr><th></th>{data.buckets.map((b) => <th key={b}>{b}</th>)}</tr>
          </thead>
          <tbody>
            {data.categories.map((cat, ri) => (
              <tr key={cat}>
                <th>{cat}</th>
                {data.buckets.map((_, ci) => {
                  const v = data.matrix[ri]?.[ci] ?? 0;
                  return <td key={ci} style={{ backgroundColor: heatColor(v, max) }}>{v || ""}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
