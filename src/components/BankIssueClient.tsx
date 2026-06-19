"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { bankApiGet } from "@/lib/api";

const SPECIAL_BANKS = new Set(["산업은행", "수출입은행", "수협은행", "농협은행", "기업은행", "공급망안정화"]);

export type BankBondRow = {
  id?: string;
  issuer?: string;
  bank?: string;
  maturity?: string;
  type?: string;
  status?: string;
  currentRate?: number | null;
  finalRate?: number | null;
  currentRateType?: string;
  finalRateType?: string;
  currentRateBase?: string;
  currentRateSpread?: number;
  finalRateBase?: string;
  finalRateSpread?: number;
  prevMarketRate?: number | null;
  [key: string]: unknown;
};

function issuerName(row: BankBondRow): string {
  return String(row.issuer ?? row.bank ?? "").trim();
}

function formatRate(row: BankBondRow): string {
  if (row.status === "발행마감") {
    if (row.finalRateType === "FRN") return `${row.finalRateBase ?? "-"} + ${row.finalRateSpread ?? 0}bp`;
    if (row.finalRate != null) return `${row.finalRate}%`;
    return "-";
  }
  if (row.currentRateType === "FRN") return `${row.currentRateBase ?? "-"} + ${row.currentRateSpread ?? 0}bp`;
  if (row.currentRate != null) return `${row.currentRate}%`;
  return "-";
}

function calcYield(face: number, price: number, couponPct: number, years: number): number | null {
  if (!face || !price || years <= 0) return null;
  const coupon = (face * couponPct) / 100;
  const approx = ((coupon + (face - price) / years) / ((face + price) / 2)) * 100;
  return Number.isFinite(approx) ? approx : null;
}

export function BankIssueClient() {
  const [rows, setRows] = useState<BankBondRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onlySpecial, setOnlySpecial] = useState(false);
  const [selected, setSelected] = useState<BankBondRow | null>(null);
  const [calc, setCalc] = useState({ face: "100", price: "99.5", coupon: "3.5", years: "3" });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const load = async () => {
      try {
        const data = await bankApiGet<BankBondRow[]>(`/bankapi/bonds?t=${Date.now()}`);
        if (!cancelled) {
          setRows(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch {
        if (!cancelled) setError("BANK ISSUE 데이터를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    timer = setInterval(() => void load(), 3000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        await bankApiGet(`/bankapi/poll?t=${Date.now()}`);
      } catch {
        /* ignore poll errors */
      }
    };
    const id = setInterval(() => void poll(), 15000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const name = issuerName(row);
      if (!onlySpecial) return true;
      return [...SPECIAL_BANKS].some((b) => name.includes(b));
    });
  }, [rows, onlySpecial]);

  const ytmPreview = useMemo(() => {
    const face = parseFloat(calc.face);
    const price = parseFloat(calc.price);
    const coupon = parseFloat(calc.coupon);
    const years = parseFloat(calc.years);
    return calcYield(face, price, coupon, years);
  }, [calc]);

  return (
    <>
      <PageHeader
        title="Bank Issue"
        description="은행채 발행 일정·금리. 산업은행·수출입은행 등 특수 은행 필터와 간이 금리 계산기를 제공합니다."
      />

      <div className="panel-card mb-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={onlySpecial} onChange={(e) => setOnlySpecial(e.target.checked)} />
          특수 은행만 (산업·수출입·수협·농협·기업·공급망안정화)
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <div className="panel-card lg:col-span-2">
          <h2 className="text-sm font-semibold mb-3">발행 목록 {loading ? "(갱신 중…)" : ""}</h2>
          {error ? <p className="text-red-400 text-sm">{error}</p> : null}
          <div className="table-scroll">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>발행사</th>
                  <th>만기</th>
                  <th>유형</th>
                  <th>상태</th>
                  <th>금리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr key={String(row.id ?? idx)} className="cursor-pointer" onClick={() => setSelected(row)}>
                    <td>{issuerName(row)}</td>
                    <td>{String(row.maturity ?? "-")}</td>
                    <td>{String(row.type ?? "-")}</td>
                    <td>{String(row.status ?? "-")}</td>
                    <td>{formatRate(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 ? <p className="empty-state">표시할 데이터가 없습니다.</p> : null}
          </div>
        </div>

        <div className="panel-card">
          <h2 className="text-sm font-semibold mb-3">금리 계산기 (간이 YTM)</h2>
          <div className="form-grid">
            <div>
              <label>액면 (억)</label>
              <input value={calc.face} onChange={(e) => setCalc({ ...calc, face: e.target.value })} />
            </div>
            <div>
              <label>가격</label>
              <input value={calc.price} onChange={(e) => setCalc({ ...calc, price: e.target.value })} />
            </div>
            <div>
              <label>표면금리 (%)</label>
              <input value={calc.coupon} onChange={(e) => setCalc({ ...calc, coupon: e.target.value })} />
            </div>
            <div>
              <label>잔존만기 (년)</label>
              <input value={calc.years} onChange={(e) => setCalc({ ...calc, years: e.target.value })} />
            </div>
          </div>
          <p className="mt-3 text-sm">
            추정 YTM:{" "}
            <strong className="text-[color:var(--color-brand)]">
              {ytmPreview != null ? `${ytmPreview.toFixed(3)}%` : "-"}
            </strong>
          </p>
          {selected ? (
            <div className="mt-4 text-xs text-[color:var(--card-muted)] border-t border-[color:var(--card-border)] pt-3">
              선택: {issuerName(selected)} / {String(selected.maturity ?? "")}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}