const fs = require("fs");
const path = require("path");
const root = "C:/forestbond-clone/web/src";
function w(rel, content) { fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true}); fs.writeFileSync(path.join(root,rel), content.trimStart(), "utf8"); console.log("wrote", rel); }

w("components/dashboard/widgets/CompassTableWidget.tsx", `"use client";

import type { DualBondRow } from "@/lib/types";

export function CompassTableWidget({ title, rows }: { title: string; rows: DualBondRow[] }) {
  return (
    <div className="terminal-widget">
      <div className="terminal-widget-header">{title}</div>
      <div className="table-scroll">
        <table className="data-table compact">
          <thead>
            <tr>
              <th>종목</th><th>민평</th><th>매매</th><th>시간</th><th>호가</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 80).map((row, i) => (
              <tr key={\`\${row.bondCD}-\${i}\`}>
                <td>{row.bondCD}</td>
                <td>{row.privateEval ?? "-"}</td>
                <td className={row.action === "buy" ? "text-up" : row.action === "sell" ? "text-down" : ""}>
                  {row.action === "buy" ? "사자" : row.action === "sell" ? "팔자" : "-"}
                </td>
                <td>{row.tradeTime ?? "-"}</td>
                <td className="truncate">{row.additionInfo?.split("\\n")[0] ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`);

w("components/dashboard/widgets/YieldGridWidget.tsx", `"use client";

const YIELDS = [
  { tenor: "2Y", code: "24-8", yield: 2.612, chg: -0.003 },
  { tenor: "3Y", code: "25-4", yield: 2.743, chg: 0.001 },
  { tenor: "5Y", code: "25-2", yield: 2.981, chg: -0.002 },
  { tenor: "10Y", code: "24-3", yield: 3.195, chg: 0.000 },
  { tenor: "20Y", code: "23-6", yield: 3.412, chg: 0.004 },
  { tenor: "30Y", code: "22-1", yield: 3.388, chg: -0.001 },
  { tenor: "50Y", code: "20-1", yield: 3.205, chg: 0.002 },
];

export function YieldGridWidget() {
  return (
    <div className="terminal-widget">
      <div className="terminal-widget-header">국채 수익률 (민평)</div>
      <div className="table-scroll">
        <table className="data-table compact">
          <thead><tr><th>만기</th><th>종목</th><th>수익률</th><th>변동</th></tr></thead>
          <tbody>
            {YIELDS.map((y) => (
              <tr key={y.tenor}>
                <td>{y.tenor}</td><td>{y.code}</td>
                <td>{y.yield.toFixed(3)}%</td>
                <td className={y.chg >= 0 ? "text-up" : "text-down"}>{y.chg >= 0 ? "+" : ""}{y.chg.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`);

w("components/dashboard/widgets/BondCalculatorWidget.tsx", `"use client";

import { useMemo, useState } from "react";

export function BondCalculatorWidget() {
  const [face, setFace] = useState("10000");
  const [coupon, setCoupon] = useState("3.5");
  const [ytm, setYtm] = useState("3.2");
  const [years, setYears] = useState("3");

  const result = useMemo(() => {
    const f = Number(face) || 10000;
    const c = Number(coupon) / 100;
    const y = Number(ytm) / 100;
    const n = Number(years) || 1;
    if (y <= 0) return { price: f, accrued: 0 };
    let pv = 0;
    for (let t = 1; t <= n; t++) pv += (f * c) / Math.pow(1 + y, t);
    pv += f / Math.pow(1 + y, n);
    return { price: Math.round(pv), accrued: Math.round(f * c / 2) };
  }, [face, coupon, ytm, years]);

  return (
    <div className="terminal-widget">
      <div className="terminal-widget-header">채권단가계산</div>
      <div className="calc-form">
        <label>액면<input value={face} onChange={(e) => setFace(e.target.value)} /></label>
        <label>표면금리(%)<input value={coupon} onChange={(e) => setCoupon(e.target.value)} /></label>
        <label>만기(년)<input value={years} onChange={(e) => setYears(e.target.value)} /></label>
        <label>수익률(%)<input value={ytm} onChange={(e) => setYtm(e.target.value)} /></label>
      </div>
      <div className="calc-result">
        <div><span>단가</span><strong>{result.price.toLocaleString()}</strong></div>
        <div><span>이자(반기)</span><strong>{result.accrued.toLocaleString()}</strong></div>
      </div>
    </div>
  );
}
`);

w("components/dashboard/widgets/MarketSummaryWidget.tsx", `"use client";

const ITEMS = [
  { name: "USD/KRW", value: "1,382.50", chg: "+3.20", up: true },
  { name: "JPY/KRW", value: "926.12", chg: "-0.85", up: false },
  { name: "Call 금리", value: "3.50%", chg: "0.00", up: true },
  { name: "CD 91D", value: "3.48%", chg: "-0.01", up: false },
  { name: "3년국채F", value: "107.45", chg: "+0.12", up: true },
  { name: "10년국채F", value: "112.08", chg: "-0.05", up: false },
];

export function MarketSummaryWidget() {
  return (
    <div className="terminal-widget">
      <div className="terminal-widget-header">시장 요약</div>
      <div className="market-list">
        {ITEMS.map((item) => (
          <div key={item.name} className="market-row">
            <span>{item.name}</span>
            <span>{item.value}</span>
            <span className={item.up ? "text-up" : "text-down"}>{item.chg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
`);

w("components/dashboard/widgets/HeatmapMiniWidget.tsx", `"use client";

import { useEffect, useState } from "react";
import type { HeatmapData } from "@/lib/types";
import { heatColor, todayIso } from "@/lib/utils";

export function HeatmapMiniWidget() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(\`/heatmapapi/heatmap?date=\${todayIso()}\`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: HeatmapData) => setData(d))
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
`);

console.log("done part 3");
