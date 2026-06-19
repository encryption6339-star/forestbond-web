const fs = require("fs");

const dashPath = "C:/forestbond-clone/web/src/components/dashboard/IntegratedDashboardClient.tsx";
let dash = fs.readFileSync(dashPath, "utf8");

if (!dash.includes("useLiveCharts")) {
  dash = dash.replace(
    'import { HeatmapMiniWidget } from "@/components/dashboard/widgets/HeatmapMiniWidget";',
    `import { HeatmapMiniWidget } from "@/components/dashboard/widgets/HeatmapMiniWidget";
import { FuturesChartPanel } from "@/components/dashboard/widgets/FuturesChartPanel";
import { YieldCurveLiveChart } from "@/components/dashboard/widgets/YieldCurveLiveChart";
import { HeatmapTrendChart } from "@/components/dashboard/widgets/HeatmapTrendChart";
import { useLiveCharts } from "@/hooks/useLiveCharts";`
  );

  dash = dash.replace(
    "const feed = useIntegratedFeed();",
    "const feed = useIntegratedFeed();\n  const charts = useLiveCharts(feed.govRows, feed.monRows, feed.messages);"
  );

  dash = dash.replace(
    "description=\"1번 영상(K-Bond 메신저)의 실시간 호가를 카테고리별로 정리하고, 2번 영상(CHECK EXPERT+)처럼 수익률·단가계산·시장요약·히트맵을 한 화면에 연동합니다.\"",
    "description=\"K-Bond 메신저 실시간 호가 + CHECK EXPERT+ 스타일 실시간 차트(캔들·민평·거래량)를 한 화면에 연동합니다.\""
  );

  const chartSection = `
        <section className="terminal-section">
          <h2 className="terminal-section-title">실시간 차트 (2번 영상 · CHECK EXPERT+)</h2>
          <div className="terminal-grid terminal-grid-3">
            {dualEnabled ? (
              <>
                <FuturesChartPanel
                  title="3년국채 F"
                  subtitle="민평 추적"
                  line={charts.gov3y.line}
                  candles={charts.gov3y.candles}
                  volume={charts.gov3y.volume}
                  lastRow={charts.gov3y.last}
                />
                <FuturesChartPanel
                  title="10년국채 F"
                  subtitle="민평 추적"
                  line={charts.gov10y.line}
                  candles={charts.gov10y.candles}
                  volume={charts.gov10y.volume}
                  lastRow={charts.gov10y.last}
                />
                <FuturesChartPanel
                  title="통안채"
                  subtitle="민평 추적"
                  line={charts.monMain.line}
                  candles={charts.monMain.candles}
                  volume={charts.monMain.volume}
                  lastRow={charts.monMain.last}
                />
              </>
            ) : (
              <div className="terminal-widget"><div className="empty-state">차트 소스(Compass WS)가 꺼져 있습니다</div></div>
            )}
          </div>
          <div className="terminal-grid terminal-grid-2 mt-grid">
            {dualEnabled ? <YieldCurveLiveChart points={charts.yieldCurve} /> : null}
            {heatmapEnabled ? <HeatmapTrendChart /> : null}
          </div>
        </section>

        <section className="terminal-section">`;

  dash = dash.replace('<section className="terminal-section">\n          <h2 className="terminal-section-title">Compass · 시장 데이터 (2번 영상)</h2>', chartSection + '\n          <h2 className="terminal-section-title">Compass · 시장 데이터 (2번 영상)</h2>');

  fs.writeFileSync(dashPath, dash, "utf8");
  console.log("updated dashboard");
}

// config DATA_SOURCES
const cfgPath = "C:/forestbond-clone/web/src/lib/dashboard-config.ts";
let cfg = fs.readFileSync(cfgPath, "utf8");
if (!cfg.includes("charts")) {
  cfg = cfg.replace(
    '{ id: "market", label: "시장 요약 (데모)", ws: null },',
    '{ id: "market", label: "시장 요약 (데모)", ws: null },\n  { id: "charts", label: "실시간 차트", ws: null },'
  );
  fs.writeFileSync(cfgPath, cfg, "utf8");
  console.log("updated config");
}

// CSS
const cssPath = "C:/forestbond-clone/web/src/app/globals.css";
let css = fs.readFileSync(cssPath, "utf8");
if (!css.includes("chart-panel")) {
  css += `

.chart-panel { min-height: 320px; max-height: none; background: #fff; color: #111; }
.chart-panel-header { display: flex; justify-content: space-between; gap: 12px; padding: 8px 10px; background: linear-gradient(180deg, #e8eef8 0%, #d5e0f0 100%); border-bottom: 1px solid #aab; }
.chart-panel-title { font-size: 13px; font-weight: 800; color: #1a2744; }
.chart-panel-sub { font-size: 11px; color: #475569; margin-top: 2px; }
.chart-panel-quote { text-align: right; }
.chart-panel-price { font-size: 20px; font-weight: 800; line-height: 1.1; }
.chart-panel-footer { display: flex; justify-content: space-between; gap: 8px; padding: 6px 10px; font-size: 11px; background: #eef2f7; border-top: 1px solid #ddd; color: #475569; }
.live-chart { width: 100%; }
`;
  fs.writeFileSync(cssPath, css, "utf8");
  console.log("updated css");
}
