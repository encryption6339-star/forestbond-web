"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchSectorRanking,
  trimSectorRanking,
  type SectorRankingData,
} from "@/lib/heatmap-api";

function formatCount(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  return new Intl.NumberFormat("en-US").format(Math.trunc(value));
}

export function SectorRankingPanel({ dateYmd }: { dateYmd: string }) {
  const [data, setData] = useState<SectorRankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchSectorRanking(dateYmd)
      .then((raw) => {
        if (!cancelled) setData(trimSectorRanking(raw));
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

  const sectors = useMemo(() => data?.sectors ?? [], [data]);

  return (
    <section className="panel-card heatmap-side-panel">
      <div className="heatmap-panel-head">
        <h2 className="heatmap-panel-title">SECTOR RANKING</h2>
        <p className="heatmap-panel-desc">
          상위 호가 건수 기준으로 특은채·은행채는 상위 5개, 그 외 섹터는 상위 10개 종목을 보여줍니다.
          {data?.asof ? <span className="heatmap-panel-asof"> · 데이터 기준 {data.asof}</span> : null}
        </p>
      </div>

      {loading ? <div className="empty-state">섹터 랭킹 로딩 중...</div> : null}
      {error ? <div className="empty-state">{error}</div> : null}

      {!loading && !error && sectors.length === 0 ? (
        <div className="empty-state">해당 기준일의 섹터 랭킹 데이터가 없습니다.</div>
      ) : null}

      {!loading && !error && sectors.length > 0 ? (
        <div className="sector-ranking-grid">
          {sectors.map((sector) => {
            const max = Math.max(...sector.rankings.map((r) => r.volume || 0), 1);
            return (
              <div key={sector.name} className="sector-ranking-card">
                <h3 className="sector-ranking-name">{sector.name}</h3>
                <ol className="sector-ranking-list">
                  {sector.rankings.map((item, idx) => (
                    <li key={`${sector.name}-${item.name}`} className="sector-ranking-item">
                      <span className="sector-ranking-rank">{idx + 1}</span>
                      <div className="sector-ranking-body">
                        <div className="sector-ranking-row">
                          <span className="sector-ranking-label">{item.name}</span>
                          <span className="sector-ranking-value">{formatCount(item.volume)}</span>
                        </div>
                        <div className="sector-ranking-bar-track">
                          <div
                            className="sector-ranking-bar-fill"
                            style={{ width: `${Math.max(4, (item.volume / max) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
