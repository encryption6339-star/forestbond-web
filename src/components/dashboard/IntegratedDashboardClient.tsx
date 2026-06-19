"use client";

import { useEffect, useState } from "react";
import {
  DASHBOARD_SOURCES_KEY,
  DATA_SOURCES,
  MESSENGER_ROOMS,
} from "@/lib/dashboard-config";
import { useIntegratedFeed } from "@/hooks/useIntegratedFeed";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { PageHeader } from "@/components/PageHeader";
import { MessengerPanel } from "@/components/dashboard/widgets/MessengerPanel";
import { CompassTableWidget } from "@/components/dashboard/widgets/CompassTableWidget";
import { YieldGridWidget } from "@/components/dashboard/widgets/YieldGridWidget";
import { BondCalculatorWidget } from "@/components/dashboard/widgets/BondCalculatorWidget";
import { MarketSummaryWidget } from "@/components/dashboard/widgets/MarketSummaryWidget";
import { HeatmapMiniWidget } from "@/components/dashboard/widgets/HeatmapMiniWidget";
import { FuturesChartPanel } from "@/components/dashboard/widgets/FuturesChartPanel";
import { YieldCurveLiveChart } from "@/components/dashboard/widgets/YieldCurveLiveChart";
import { HeatmapTrendChart } from "@/components/dashboard/widgets/HeatmapTrendChart";
import { useLiveCharts } from "@/hooks/useLiveCharts";

function loadSources(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(DASHBOARD_SOURCES_KEY);
    if (!raw) return Object.fromEntries(DATA_SOURCES.map((s) => [s.id, true]));
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(DATA_SOURCES.map((s) => [s.id, true]));
  }
}

export function IntegratedDashboardClient() {
  const feed = useIntegratedFeed();
  const charts = useLiveCharts(feed.govRows, feed.monRows, feed.messages);
  const [sources, setSources] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSources(loadSources());
  }, []);

  const toggleSource = (id: string) => {
    setSources((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(DASHBOARD_SOURCES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const mapEnabled = sources.map !== false;
  const dualEnabled = sources.dual !== false;
  const heatmapEnabled = sources.heatmap !== false;
  const marketEnabled = sources.market !== false;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="K-Bond 메신저 실시간 호가와 시장 데이터를 한 화면에서 확인합니다."
        actions={
          <>
            <ConnectionBadge status={feed.status.map} prefix="Map" />
            <ConnectionBadge status={feed.status.dual} prefix="Compass" />
          </>
        }
      />

      <div className="source-bar">
        <span className="source-bar-label">연동 소스</span>
        {DATA_SOURCES.map((src) => (
          <label key={src.id} className="source-toggle">
            <input
              type="checkbox"
              checked={sources[src.id] ?? true}
              onChange={() => toggleSource(src.id)}
            />
            {src.label}
          </label>
        ))}
      </div>

      <div className="integrated-terminal">
        <section className="terminal-section">
          <h2 className="terminal-section-title">K-Bond 메신저 실시간</h2>
          <div className="terminal-grid terminal-grid-3">
            {mapEnabled ? (
              MESSENGER_ROOMS.map((room) => (
                <MessengerPanel
                  key={room.id}
                  title={room.title}
                  messages={feed.getRoomMessages(room.id)}
                />
              ))
            ) : (
              <div className="terminal-widget"><div className="empty-state">Map 소스가 꺼져 있습니다</div></div>
            )}
          </div>
        </section>

        
        <section className="terminal-section">
          <h2 className="terminal-section-title">실시간 차트</h2>
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

        <section className="terminal-section">
          <h2 className="terminal-section-title">Compass · 시장 데이터</h2>
          <div className="terminal-grid terminal-grid-2">
            {dualEnabled ? (
              <>
                <CompassTableWidget title="국채 Compass" rows={feed.govRows} />
                <CompassTableWidget title="통안 Compass" rows={feed.monRows} />
              </>
            ) : (
              <div className="terminal-widget"><div className="empty-state">Compass 소스가 꺼져 있습니다</div></div>
            )}
          </div>
          <div className="terminal-grid terminal-grid-3 mt-grid">
            {marketEnabled ? <YieldGridWidget /> : null}
            <BondCalculatorWidget />
            {marketEnabled ? <MarketSummaryWidget /> : null}
          </div>
          {heatmapEnabled ? (
            <div className="mt-grid">
              <HeatmapMiniWidget />
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
