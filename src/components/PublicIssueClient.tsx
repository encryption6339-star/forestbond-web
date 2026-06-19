"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { httpGet } from "@/lib/api";

type PublicRow = Record<string, unknown> & {
  issue_name?: string;
  issuer?: string;
  bid_date?: string;
  maturity_term?: string;
  credit_grade?: string;
  category?: string;
};

const TABS = [
  { id: "all", label: "전체" },
  { id: "local", label: "지방", match: "지방" },
  { id: "special", label: "특수", match: "특수" },
  { id: "finance", label: "금융", match: "금융" },
  { id: "corp", label: "회사", match: "회사" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function rowText(row: PublicRow): string {
  return `${row.category ?? ""} ${row.issue_name ?? ""} ${row.issuer ?? ""}`;
}

function parseBidDate(bid: string | undefined): number | null {
  if (!bid) return null;
  const d = new Date(bid);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function PublicIssueClient() {
  const [upcoming, setUpcoming] = useState<PublicRow[]>([]);
  const [allRows, setAllRows] = useState<PublicRow[]>([]);
  const [tab, setTab] = useState<TabId>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [u, a] = await Promise.all([
          httpGet<PublicRow[]>("/api/calendar/issue_public_data", { signal: ac.signal }),
          httpGet<PublicRow[]>("/api/calendar/issue_public_data/all", { signal: ac.signal }),
        ]);
        setUpcoming(Array.isArray(u) ? u : []);
        setAllRows(Array.isArray(a) ? a : []);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError("공사채 발행 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const todayRows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const t = today.getTime();
    return upcoming
      .filter((row) => {
        const ts = parseBidDate(row.bid_date);
        return ts != null && ts >= t;
      })
      .sort((a, b) => (parseBidDate(a.bid_date) ?? 0) - (parseBidDate(b.bid_date) ?? 0));
  }, [upcoming]);

  const filteredAll = useMemo(() => {
    const def = TABS.find((t) => t.id === tab);
    if (!def || tab === "all" || !("match" in def)) return allRows;
    const m = def.match;
    return allRows.filter((row) => rowText(row).includes(m));
  }, [allRows, tab]);

  return (
    <>
      <PageHeader title="Public Issue" description="지방·특수·금융·회사 공사채 발행 예정 및 전체 내역" />
      <div className="public-issue-tabs mb-4">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? "active" : undefined} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-red-400 text-sm mb-3">{error}</p> : null}
      {loading ? <p className="empty-state">불러오는 중…</p> : null}

      <section className="panel-card mb-4">
        <h2 className="text-sm font-semibold mb-3">입찰 예정 (오늘 이후)</h2>
        <div className="table-scroll">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>입찰일</th>
                <th>종목</th>
                <th>발행사</th>
                <th>만기</th>
                <th>등급</th>
              </tr>
            </thead>
            <tbody>
              {todayRows.map((row, idx) => (
                <tr key={`${row.bid_date}-${idx}`}>
                  <td>{String(row.bid_date ?? "-")}</td>
                  <td>{String(row.issue_name ?? "-")}</td>
                  <td>{String(row.issuer ?? "-")}</td>
                  <td>{String(row.maturity_term ?? "-")}</td>
                  <td>{String(row.credit_grade ?? "-")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel-card">
        <h2 className="text-sm font-semibold mb-3">전체 발행 내역</h2>
        <div className="table-scroll">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>입찰일</th>
                <th>종목</th>
                <th>발행사</th>
                <th>만기</th>
                <th>등급</th>
              </tr>
            </thead>
            <tbody>
              {filteredAll.map((row, idx) => (
                <tr key={`all-${idx}`}>
                  <td>{String(row.bid_date ?? "-")}</td>
                  <td>{String(row.issue_name ?? "-")}</td>
                  <td>{String(row.issuer ?? "-")}</td>
                  <td>{String(row.maturity_term ?? "-")}</td>
                  <td>{String(row.credit_grade ?? "-")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}