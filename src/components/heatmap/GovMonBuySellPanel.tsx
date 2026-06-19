"use client";

import { useEffect, useState } from "react";
import { fetchGovMon, type GovMonBondRow, type GovMonData } from "@/lib/heatmap-api";

function formatCount(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  return new Intl.NumberFormat("en-US").format(Math.trunc(value));
}

function BuySellBars({ rows, emptyLabel }: { rows: GovMonBondRow[]; emptyLabel: string }) {
  if (!rows.length) {
    return <div className="empty-state">{emptyLabel}</div>;
  }

  const max = Math.max(...rows.map((r) => Math.max(r.buy || 0, r.sell || 0)), 1);

  return (
    <div className="govmon-list">
      {rows.map((row) => (
        <div key={row.trade_code} className="govmon-row">
          <div className="govmon-code">{row.trade_code}</div>
          <div className="govmon-bars">
            <div className="govmon-bar-line">
              <span className="govmon-side buy">BUY</span>
              <div className="govmon-bar-track">
                <div
                  className="govmon-bar-fill buy"
                  style={{ width: `${Math.max(2, ((row.buy || 0) / max) * 100)}%` }}
                />
              </div>
              <span className="govmon-count">{formatCount(row.buy || 0)}</span>
            </div>
            <div className="govmon-bar-line">
              <span className="govmon-side sell">SELL</span>
              <div className="govmon-bar-track">
                <div
                  className="govmon-bar-fill sell"
                  style={{ width: `${Math.max(2, ((row.sell || 0) / max) * 100)}%` }}
                />
              </div>
              <span className="govmon-count">{formatCount(row.sell || 0)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GovMonBuySellPanel({ dateYmd }: { dateYmd: string }) {
  const [data, setData] = useState<GovMonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchGovMon(dateYmd)
      .then((raw) => {
        if (!cancelled) setData(raw);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "오류");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateYmd]);

  return (
    <section className="panel-card heatmap-side-panel">
      <div className="heatmap-panel-head">
        <h2 className="heatmap-panel-title">GOV/MON BUY/SELL</h2>
        <p className="heatmap-panel-desc">
          기준일 기준 국고(GOV)·통안(MON) 채권의 매수·매도 호가 건수 상위 종목을 시각화합니다.
          {data?.asof ? <span className="heatmap-panel-asof"> · 데이터 기준 {data.asof}</span> : null}
        </p>
      </div>

      {loading ? <div className="empty-state">GOV/MON 데이터 로딩 중...</div> : null}
      {error ? <div className="empty-state">{error}</div> : null}

      {!loading && !error ? (
        <div className="govmon-grid">
          <div className="govmon-column">
            <h3 className="govmon-column-title">GOV · 국고</h3>
            <BuySellBars rows={data?.gov ?? []} emptyLabel="국고 채권 데이터가 없습니다." />
          </div>
          <div className="govmon-column">
            <h3 className="govmon-column-title">MON · 통안</h3>
            <BuySellBars rows={data?.mon ?? []} emptyLabel="통안 채권 데이터가 없습니다." />
          </div>
        </div>
      ) : null}
    </section>
  );
}
