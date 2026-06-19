const fs = require("fs");
const path = require("path");
const root = "C:/forestbond-clone/web/src";
function w(rel, c) { fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true}); fs.writeFileSync(path.join(root,rel), c.trimStart(), "utf8"); console.log("w", rel); }

w("components/dashboard/widgets/FuturesChartPanel.tsx", `"use client";

import { LiveChart } from "@/components/charts/LiveChart";
import type { CandlePoint, HistPoint, LinePoint } from "@/hooks/useLiveCharts";
import type { DualBondRow } from "@/lib/types";

function fmtChange(line: LinePoint[]) {
  if (line.length < 2) return { delta: 0, pct: 0 };
  const a = line[line.length - 2].value;
  const b = line[line.length - 1].value;
  return { delta: b - a, pct: a ? ((b - a) / a) * 100 : 0 };
}

export function FuturesChartPanel({
  title,
  subtitle,
  line,
  candles,
  volume,
  lastRow,
}: {
  title: string;
  subtitle: string;
  line: LinePoint[];
  candles: CandlePoint[];
  volume: HistPoint[];
  lastRow?: DualBondRow;
}) {
  const y = lastRow?.privateEval != null ? Number(lastRow.privateEval) : line.at(-1)?.value;
  const { delta } = fmtChange(line);
  const price = candles.at(-1)?.close;
  const up = delta <= 0;

  return (
    <div className="chart-panel terminal-widget">
      <div className="chart-panel-header">
        <div>
          <div className="chart-panel-title">{title}</div>
          <div className="chart-panel-sub">{subtitle} {lastRow?.bondCD ? \`| \${lastRow.bondCD}\` : ""}</div>
        </div>
        <div className="chart-panel-quote">
          <div className="chart-panel-price">{price != null ? price.toFixed(2) : y != null ? y.toFixed(3) + "%" : "-"}</div>
          <div className={up ? "text-down" : "text-up"}>
            {delta !== 0 ? \`\${delta > 0 ? "+" : ""}\${delta.toFixed(3)}\` : "0.000"}
          </div>
        </div>
      </div>
      <LiveChart candles={candles} line={line} volume={volume} height={200} mode="combo" />
      <div className="chart-panel-footer">
        <span>민평 {y != null ? y.toFixed(3) + "%" : "-"}</span>
        <span>{lastRow?.action === "buy" ? "사자" : lastRow?.action === "sell" ? "팔자" : "관망"}</span>
        <span>{lastRow?.tradeTime ?? ""}</span>
      </div>
    </div>
  );
}
`);

w("components/dashboard/widgets/YieldCurveLiveChart.tsx", `"use client";

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
`);

w("components/dashboard/widgets/HeatmapTrendChart.tsx", `"use client";

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
`);

console.log("batch2 ok");
