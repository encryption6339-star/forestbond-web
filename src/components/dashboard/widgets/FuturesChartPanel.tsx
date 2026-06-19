"use client";

import { LiveChart } from "@/components/charts/LiveChart";
import type { CandlePoint, HistPoint, LinePoint } from "@/hooks/useLiveCharts";
import type { DualBondRow } from "@/lib/types";
import { formatDisplayTime } from "@/lib/utils";

function fmtPriceChange(candles: CandlePoint[]) {
  if (candles.length < 2) return 0;
  return candles[candles.length - 1].close - candles[candles.length - 2].close;
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
  const delta = fmtPriceChange(candles);
  const price = candles.at(-1)?.close;
  const up = delta >= 0;

  const hasData = line.length > 0 || candles.length > 0;

  return (
    <div className="chart-panel terminal-widget">
      <div className="chart-panel-header">
        <div>
          <div className="chart-panel-title">{title}</div>
          <div className="chart-panel-sub">{subtitle} · Compass 민평 {lastRow?.bondCD ? `| ${lastRow.bondCD}` : ""}</div>
        </div>
        <div className="chart-panel-quote">
          <div className="chart-panel-price">{price != null ? price.toFixed(2) : y != null ? y.toFixed(3) + "%" : "-"}</div>
          <div className={up ? "text-down" : "text-up"}>
            {delta !== 0 ? `${delta > 0 ? "+" : ""}${delta.toFixed(2)}` : "0.00"}
          </div>
        </div>
      </div>
      {hasData ? (
        <LiveChart candles={candles} line={line} volume={volume} height={200} mode="combo" />
      ) : (
        <div className="empty-state chart-panel-empty">Compass WS 데이터 대기 중 (연결 후 민평 기준으로 갱신)</div>
      )}
      <div className="chart-panel-footer">
        <span>민평 {y != null ? y.toFixed(3) + "%" : "-"}</span>
        <span>{lastRow?.action === "buy" ? "사자" : lastRow?.action === "sell" ? "팔자" : "관망"}</span>
        <span>{formatDisplayTime(lastRow?.tradeTime)}</span>
      </div>
    </div>
  );
}
