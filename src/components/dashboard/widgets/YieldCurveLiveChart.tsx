"use client";

import { LiveChart } from "@/components/charts/LiveChart";
import type { LinePoint } from "@/hooks/useLiveCharts";
import { nowKstUnix } from "@/lib/utils";

export function YieldCurveLiveChart({ points }: { points: LinePoint[] }) {
  const now = nowKstUnix();
  const data = points.map((p, i) => ({ time: now - (points.length - i) * 60, value: p.value }));
  return (
    <div className="chart-panel terminal-widget">
      <div className="chart-panel-header">
        <div>
          <div className="chart-panel-title">국채 민평 Yield Curve (실시간)</div>
          <div className="chart-panel-sub">Compass WS 스냅샷 기준 · KST</div>
        </div>
      </div>
      <LiveChart line={data} height={220} mode="line" />
    </div>
  );
}
