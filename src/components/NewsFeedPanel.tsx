"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { httpGet } from "@/lib/api";
import { cn, formatKstDateTime } from "@/lib/utils";

type NewsItem = {
  id?: string;
  title?: string;
  content?: string;
  message?: string;
  published_at?: string;
  publishedAt?: string;
  date?: string;
  source?: string;
};

type NewsFeedResponse = {
  data?: NewsItem[];
  items?: NewsItem[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};

function itemText(item: NewsItem): string {
  return item.title ?? item.content ?? item.message ?? "";
}

function itemDate(item: NewsItem): string {
  const raw = item.published_at ?? item.publishedAt ?? item.date ?? "";
  if (!raw) return "";
  return formatKstDateTime(raw);
}

export function NewsFeedPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    return params.toString();
  }, [page, limit, startDate, endDate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await httpGet<NewsFeedResponse>(`/api/news-feed?${query}`);
      const rows = res.data ?? res.items ?? (Array.isArray(res) ? (res as NewsItem[]) : []);
      setItems(rows);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "뉴스를 불러오지 못했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  if (!open) return null;

  return (
    <>
      <button type="button" className="news-panel-backdrop" aria-label="닫기" onClick={onClose} />
      <aside className="news-panel" aria-label="News feed">
        <header className="news-panel-header">
          <strong>Market News</strong>
          <div className="news-panel-actions">
            <button type="button" className="btn" onClick={() => setFilterOpen((v) => !v)} aria-expanded={filterOpen}>
              <Calendar size={14} /> 날짜
            </button>
            <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </header>
        {filterOpen ? (
          <div className="news-panel-filter">
            <label>
              시작일
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              종료일
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setPage(1);
                void load();
              }}
            >
              적용
            </button>
          </div>
        ) : null}
        <div className="news-panel-body">
          {loading ? <p className="empty-state">불러오는 중…</p> : null}
          {error ? <p className="empty-state text-red-400">{error}</p> : null}
          {!loading && !error && items.length === 0 ? <p className="empty-state">표시할 뉴스가 없습니다.</p> : null}
          {items.map((item, idx) => (
            <article key={item.id ?? `${itemDate(item)}-${idx}`} className="news-panel-item">
              <time className="news-panel-date">{itemDate(item) || "-"}</time>
              <p>{itemText(item)}</p>
              {item.source ? <span className="news-panel-source">{item.source}</span> : null}
            </article>
          ))}
        </div>
        <footer className="news-panel-footer">
          <button
            type="button"
            className="btn"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} /> 이전
          </button>
          <span className="news-panel-page">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            다음 <ChevronRight size={14} />
          </button>
        </footer>
      </aside>
    </>
  );
}

export function NewsFeedToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={cn("btn", active && "btn-primary")} onClick={onClick} aria-pressed={active}>
      News
    </button>
  );
}