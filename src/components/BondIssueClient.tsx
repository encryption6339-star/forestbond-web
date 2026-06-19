"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { httpGet } from "@/lib/api";

type GovRow = {
  issue_date?: string;
  bond_name?: string;
  issue_name?: string;
  bond_type?: string;
  amount?: string | number;
  [key: string]: unknown;
};

type SentenceRow = { sequence?: number; sentence?: string };
type HolidayInfo = { name?: string; [key: string]: unknown };

function normalizeDateKey(raw: string | undefined): string | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return null;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function monthMatrix(cursor: Date): (Date | null)[][] {
  const first = startOfMonth(cursor);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(first.getFullYear(), first.getMonth(), day));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BondIssueClient() {
  const [govRows, setGovRows] = useState<GovRow[]>([]);
  const [sentences, setSentences] = useState<SentenceRow[]>([]);
  const [holidays, setHolidays] = useState<Map<string, HolidayInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const [govRes, sentRes, holRes] = await Promise.all([
          httpGet<GovRow[]>("/api/calendar/issue-gov-data", { signal: ac.signal }),
          httpGet<SentenceRow[]>("/api/calendar/calendar-sentences", { signal: ac.signal }),
          httpGet<Record<string, HolidayInfo | Record<string, HolidayInfo>>>("/api/calendar/korean-holidays", {
            signal: ac.signal,
          }),
        ]);
        setGovRows(Array.isArray(govRes) ? govRes : []);
        setSentences(Array.isArray(sentRes) ? sentRes : []);
        const map = new Map<string, HolidayInfo>();
        if (holRes && typeof holRes === "object") {
          Object.entries(holRes).forEach(([key, val]) => {
            if (val && typeof val === "object") {
              if (/^\d{4}-\d{2}-\d{2}$/.test(key)) map.set(key, val as HolidayInfo);
              else
                Object.entries(val as Record<string, HolidayInfo>).forEach(([d, info]) => {
                  if (/^\d{4}-\d{2}-\d{2}$/.test(d) && info) map.set(d, info);
                });
            }
          });
        }
        setHolidays(map);
        setError("");
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError("국채/통안채 캘린더 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, GovRow[]>();
    govRows.forEach((row) => {
      const key = normalizeDateKey(row.issue_date);
      if (!key) return;
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    });
    return map;
  }, [govRows]);

  const sentenceText = useMemo(
    () =>
      [...sentences]
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
        .map((s) => s.sentence)
        .filter(Boolean)
        .join(" "),
    [sentences]
  );

  const weeks = useMemo(() => monthMatrix(cursor), [cursor]);

  const weekBoard = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + 7);
    const items: { date: string; rows: GovRow[] }[] = [];
    for (let d = new Date(today); d < end; d.setDate(d.getDate() + 1)) {
      const key = ymd(d);
      const rows = byDate.get(key) ?? [];
      if (rows.length) items.push({ date: key, rows });
    }
    return items;
  }, [byDate]);

  return (
    <>
      <PageHeader title="Bond Issue" description="국고·통안채 발행 일정을 달력과 주간 보드로 확인합니다." />
      {error ? <p className="text-red-400 text-sm mb-3">{error}</p> : null}
      {loading ? <p className="empty-state mb-4">불러오는 중…</p> : null}

      {sentenceText ? (
        <div className="panel-card mb-4 text-sm leading-relaxed text-[color:var(--card-muted)]">{sentenceText}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel-card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">
              {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
            </h2>
            <div className="flex gap-2">
              <button type="button" className="btn" onClick={() => setCursor((c) => addMonths(c, -1))}>
                <ChevronLeft size={14} />
              </button>
              <button type="button" className="btn" onClick={() => setCursor(startOfMonth(new Date()))}>
                오늘
              </button>
              <button type="button" className="btn" onClick={() => setCursor((c) => addMonths(c, 1))}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div className="calendar-grid">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className="calendar-grid-head">
                {d}
              </div>
            ))}
            {weeks.flat().map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="calendar-grid-cell muted" />;
              const key = ymd(day);
              const events = byDate.get(key) ?? [];
              const holiday = holidays.get(key);
              return (
                <div key={key} className={`calendar-grid-cell${events.length ? " has-events" : ""}`}>
                  <div className="calendar-grid-day">{day.getDate()}</div>
                  {holiday?.name ? <div className="calendar-grid-holiday">{holiday.name}</div> : null}
                  {events.slice(0, 2).map((ev, i) => (
                    <div key={i} className="calendar-grid-event">
                      {String(ev.bond_name ?? ev.issue_name ?? ev.bond_type ?? "발행")}
                    </div>
                  ))}
                  {events.length > 2 ? <div className="calendar-grid-more">+{events.length - 2}</div> : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel-card">
          <h2 className="text-sm font-semibold mb-3">주간 발행 보드</h2>
          {weekBoard.length === 0 ? <p className="empty-state">7일 내 일정 없음</p> : null}
          <ul className="calendar-week-list">
            {weekBoard.map(({ date, rows }) => (
              <li key={date}>
                <strong>{date}</strong>
                <ul>
                  {rows.map((r, i) => (
                    <li key={i}>{String(r.bond_name ?? r.issue_name ?? r.bond_type ?? "-")}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}