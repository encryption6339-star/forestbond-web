"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { httpGet, httpPost } from "@/lib/api";
import { WS_URL_KBOND } from "@/lib/config";

const CATEGORY_TABS = [
  { key: "public", label: "\uACF5\uC0AC\uCC44" },
  { key: "bank", label: "\uC740\uD589\uCC44" },
  { key: "indust", label: "\uD2B9\uC740\uCC44" },
  { key: "perp", label: "\uC5EC\uC804\uCC44" },
  { key: "comp", label: "\uD68C\uC0AC\uCC44" },
] as const;

type CategoryKey = (typeof CATEGORY_TABS)[number]["key"];

type TradeRow = {
  id: string;
  trade_name?: string;
  trade_time?: string;
  message?: string;
  category?: string;
  bond_expr_dt?: string;
  issuer?: string;
  credit_avg?: string;
  credit_rating?: string;
  [key: string]: unknown;
};

type Paginated = {
  data?: TradeRow[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};

function labelForCategory(key: CategoryKey): string {
  return CATEGORY_TABS.find((t) => t.key === key)?.label ?? key;
}

function normalizeRow(raw: Record<string, unknown>, idx: number): TradeRow {
  const trade_name = String(raw.trade_name ?? raw.issuer ?? "");
  const trade_time = String(raw.trade_time ?? raw.time ?? "");
  return {
    id: String(raw.id ?? `${trade_name}|${trade_time}|${idx}`),
    trade_name,
    trade_time,
    message: String(raw.message ?? raw.msg ?? ""),
    category: String(raw.category ?? ""),
    bond_expr_dt: String(raw.bond_expr_dt ?? raw.maturity ?? ""),
    issuer: String(raw.issuer ?? ""),
    credit_avg: String(raw.credit_avg ?? ""),
    credit_rating: String(raw.credit_rating ?? ""),
    ...raw,
  };
}

export function ScopeClient() {
  const [category, setCategory] = useState<CategoryKey>("public");
  const [search, setSearch] = useState("");
  const [issuerHints, setIssuerHints] = useState<string[]>([]);
  const [rows, setRows] = useState<TradeRow[]>([]);
  const [historyRows, setHistoryRows] = useState<TradeRow[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.trade_name, r.message, r.issuer, r.bond_expr_dt].some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [rows, search]);

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await httpGet<Paginated>(`/api/trade/trade-another-kbond?page=${p}&limit=100`);
      const list = (res.data ?? []).map((row, idx) => normalizeRow(row as Record<string, unknown>, idx));
      setRows(list);
      setPage(res.pagination?.page ?? p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "\uCCB4\uACB0 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategoryHistory = useCallback(async (cat: CategoryKey) => {
    setHistoryLoading(true);
    try {
      const res = await httpPost<TradeRow[] | { data?: TradeRow[] }>("/api/trade/trade-history-by-category", {
        category: labelForCategory(cat),
      });
      const list = Array.isArray(res) ? res : (res.data ?? []);
      setHistoryRows(list.map((row, idx) => normalizeRow(row as Record<string, unknown>, idx)));
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    void loadCategoryHistory(category);
  }, [category, loadCategoryHistory]);

  useEffect(() => {
    const ws = new WebSocket(WS_URL_KBOND);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(String(ev.data)) as Record<string, unknown>;
        const items = Array.isArray(payload) ? payload : (payload.data as unknown[] | undefined);
        if (Array.isArray(items)) {
          setRows((prev) => {
            const mapped = items.map((row, idx) => normalizeRow(row as Record<string, unknown>, idx));
            return [...mapped, ...prev].slice(0, 300);
          });
          return;
        }
        setRows((prev) => [normalizeRow(payload, 0), ...prev].slice(0, 300));
      } catch {
        /* ignore */
      }
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  const findIssuer = async () => {
    const q = search.trim();
    if (!q) return;
    try {
      const res = await httpPost<{ keywords?: string[]; bestMatch?: string }>("/api/find-issuer", {
        searchKeyword: q,
      });
      const list = res.keywords ?? [];
      if (res.bestMatch && !list.includes(res.bestMatch)) list.push(res.bestMatch);
      setIssuerHints(list);
    } catch {
      setIssuerHints([]);
    }
  };

  return (
    <>
      <PageHeader
        title="Scope"
        description="\uD06C\uB808\uB527 \uCC44\uAD8C \uD638\uAC00\u00B7\uCCB4\uACB0 Scope. \uCE74\uD14C\uACE0\uB9AC\uBCC4 \uD544\uD130, REST \uCCB4\uACB0 \uB0B4\uC5ED, \uC2E4\uC2DC\uAC04 WebSocket."
        actions={<ConnectionBadge status={{ connected, mock: false }} />}
      />

      <div className="public-issue-tabs mb-3">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={category === tab.key ? "active" : undefined}
            onClick={() => setCategory(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="panel-card mb-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="scope-search">\uC885\uBAA9\u00B7\uBC1C\uD589\uC0AC \uAC80\uC0C9</label>
          <input id="scope-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="\uAC80\uC0C9\uC5B4" />
        </div>
        <button type="button" className="btn btn-primary" onClick={() => void findIssuer()}>
          \uBC1C\uD589\uC0AC \uCC3E\uAE30
        </button>
        <button type="button" className="btn" onClick={() => setSearch("")}>
          \uCD08\uAE30\uD654
        </button>
        <button type="button" className="btn" disabled={loading} onClick={() => void loadPage(page)}>
          \uC0C8\uB85C\uACE0\uCE68
        </button>
      </div>

      {issuerHints.length > 0 ? (
        <div className="panel-card mb-4 text-sm">
          <span className="text-[color:var(--card-muted)]">\uCD94\uCC9C \uD0A4\uC6CC\uB4DC: </span>
          {issuerHints.map((h) => (
            <button key={h} type="button" className="btn mr-2 mt-2" onClick={() => setSearch(h)}>
              {h}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-red-400 text-sm mb-3">{error}</p> : null}

      <section className="panel-card mb-4">
        <h2 className="text-sm font-semibold mb-2">\uC2E4\uC2DC\uAC04 / \uCD5C\uADFC \uCCB4\uACB0\u00B7\uD638\uAC00</h2>
        <div className="scope-table-wrap">
          <table className="data-table compact scope-table">
            <thead>
              <tr>
                <th>\uC2DC\uAC04</th>
                <th>\uC885\uBAA9</th>
                <th>\uB9CC\uAE30</th>
                <th>\uB4F1\uAE09</th>
                <th>\uBA54\uC2DC\uC9C0</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.trade_time ?? "-"}</td>
                  <td>{row.trade_name ?? row.issuer ?? "-"}</td>
                  <td>{row.bond_expr_dt ?? "-"}</td>
                  <td>{row.credit_avg || row.credit_rating || "-"}</td>
                  <td className="truncate">{row.message ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading ? <p className="empty-state">\uBD88\uB7EC\uC624\uB294 \uC911\u2026</p> : null}
          {!loading && filteredRows.length === 0 ? <p className="empty-state">\uB370\uC774\uD130 \uC5C6\uC74C</p> : null}
        </div>
      </section>

      <section className="panel-card">
        <h2 className="text-sm font-semibold mb-2">
          {labelForCategory(category)} \uCCB4\uACB0 \uB0B4\uC5ED
        </h2>
        <div className="scope-table-wrap">
          <table className="data-table compact scope-table">
            <thead>
              <tr>
                <th>\uC2DC\uAC04</th>
                <th>\uC885\uBAA9</th>
                <th>\uB9CC\uAE30</th>
                <th>\uBA54\uC2DC\uC9C0</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((row) => (
                <tr key={`hist-${row.id}`}>
                  <td>{row.trade_time ?? "-"}</td>
                  <td>{row.trade_name ?? "-"}</td>
                  <td>{row.bond_expr_dt ?? "-"}</td>
                  <td>{row.message ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {historyLoading ? <p className="empty-state">\uB0B4\uC5ED \uBD88\uB7EC\uC624\uB294 \uC911\u2026</p> : null}
        </div>
      </section>
    </>
  );
}