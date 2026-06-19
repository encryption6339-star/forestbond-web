"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { HeatmapData } from "@/lib/types";
import {
  addBusinessDays,
  formatYmdDisplay,
  heatmapColor,
  todayKstYmd,
} from "@/lib/utils";
import { HEATMAP_CATEGORIES } from "@/lib/config";
import { PageHeader } from "@/components/PageHeader";
import { SectorRankingPanel } from "@/components/heatmap/SectorRankingPanel";
import { GovMonBuySellPanel } from "@/components/heatmap/GovMonBuySellPanel";

async function fetchHeatmap(date: string): Promise<HeatmapData> {
  const res = await fetch(`/heatmapapi/heatmap?date=${date}`, { cache: "no-store" });
  if (!res.ok) throw new Error("히트맵 데이터를 불러올 수 없습니다.");
  return res.json();
}

async function fetchPrevValidDate(date: string): Promise<string> {
  const res = await fetch(`/heatmapapi/prev-valid-date?date=${date}`, { cache: "no-store" });
  if (!res.ok) return "";
  const data = await res.json();
  return data.prev ?? "";
}

function normalizeHeatmap(data: HeatmapData) {
  const categories = [...HEATMAP_CATEGORIES];
  const buckets = [...data.buckets];
  const matrix = data.matrix.map((row) => [...row]);
  const totals = data.bucketTotals ?? matrix.map((row) => row.reduce((a, b) => a + (b || 0), 0));
  const max = Math.max(...matrix.flat(), 1);
  return { categories, buckets, matrix, totals, max, asof: data.asof };
}

export function HeatmapClient() {
  const [date, setDate] = useState(() => todayKstYmd());
  const [data, setData] = useState<ReturnType<typeof normalizeHeatmap> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (targetDate: string) => {
    setLoading(true);
    setError("");
    try {
      const raw = await fetchHeatmap(targetDate);
      setData(normalizeHeatmap(raw));
      if (raw.asof) setDate(raw.asof.replace(/-/g, ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  const goPrev = async () => {
    const prev = await fetchPrevValidDate(date);
    if (prev) setDate(prev.replace(/-/g, ""));
    else setDate(addBusinessDays(date, -1));
  };

  const goNext = () => setDate(addBusinessDays(date, 1));

  const displayDate = useMemo(() => {
    if (date.length === 8) return formatYmdDisplay(date);
    return date;
  }, [date]);

  return (
    <>
      <PageHeader
        title="Bond Heatmap"
        description="막무가내 대화방의 기반으로 일자별 히트맵을 확인합니다."
        actions={
          <div className="flex items-center gap-2">
            <button type="button" className="btn" title="이전 영업일" onClick={goPrev}>
              ◀
            </button>
            <label className="flex items-center gap-2 text-xs">
              <span>기준일</span>
              <input
                type="date"
                value={`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`}
                onChange={(e) => setDate(e.target.value.replace(/-/g, ""))}
              />
            </label>
            <button type="button" className="btn" title="다음 영업일" onClick={goNext}>
              ▶
            </button>
          </div>
        }
      />

      <div className="panel-card">
        <div className="mb-3 text-sm text-[color:var(--card-muted)]">
          {loading ? "로딩 중..." : `기준일: ${displayDate}`}
        </div>
        {error ? <div className="empty-state">{error}</div> : null}
        {!loading && data ? (
          <div className="overflow-auto">
            <table className="heatmap-table">
              <thead>
                <tr>
                  <th>잔존만기</th>
                  {data.categories.map((cat) => (
                    <th key={cat}>{cat}</th>
                  ))}
                  <th>합계</th>
                </tr>
              </thead>
              <tbody>
                {data.buckets.map((bucket, rowIdx) => (
                  <tr key={bucket}>
                    <th>{bucket}</th>
                    {data.matrix[rowIdx]?.map((value, colIdx) => (
                      <td
                        key={`${bucket}-${data.categories[colIdx]}`}
                        className="heatmap-cell"
                        style={{ background: heatmapColor(value, data.max) }}
                        title={`${bucket} / ${data.categories[colIdx]}: ${value}`}
                      >
                        {value || ""}
                      </td>
                    ))}
                    <td className="font-semibold">{data.totals[rowIdx] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="heatmap-panels-stack">
        <SectorRankingPanel dateYmd={date} />
        <GovMonBuySellPanel dateYmd={date} />
      </div>
    </>
  );
}
