"use client";

import { LiveChart } from "@/components/charts/LiveChart";
import type { LinePoint } from "@/hooks/useLiveCharts";

export function YieldCurveLiveChart({ points }: { points: LinePoint[] }) {
  const now = Math.floor(Date.now() / 1000);
  const data = points.map((p, i) => ({ time: now - (points.length - i) * 60, value: p.value }));
  return (
    <div className="chart-panel terminal-widget">
      <div className="chart-panel-header">
        <div>
          <div className="chart-panel-title">국채 민평 Yield Curve (실시간)</div>
          <div className="chart-panel-sub">Compass WS 스냅샷 기준</div>
        </div>
      </div>
      <LiveChart line={data} height={220} mode="line" />
    </div>
  );
}
