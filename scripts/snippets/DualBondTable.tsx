"use client";

import { useState, type ReactNode } from "react";
import { actionLabel, copyText } from "@/lib/utils";
import type { DualBondRow } from "@/lib/types";

export function DualBondTable({
  title,
  rows,
  loading,
  headerRight,
}: {
  title: string;
  rows: DualBondRow[];
  loading: boolean;
  headerRight?: ReactNode;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="panel-card h-full flex flex-col min-h-[420px]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {headerRight}
      </div>
      <div className="flex-1 overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>종목</th>
              <th>민평</th>
              <th>매매</th>
              <th>시간</th>
              <th>추가정보</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  표시할 항목이 없습니다
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const key = `${row.bondCD}-${idx}`;
                const action = row.action;
                return (
                  <tr
                    key={key}
                    onClick={() => setExpanded((v) => (v === key ? null : key))}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="font-semibold">{row.bondCD}</div>
                      <div className="text-[11px] text-[color:var(--card-muted)]">{row.fullname}</div>
                    </td>
                    <td>{row.privateEval ?? "-"}</td>
                    <td className={action === "buy" ? "action-buy" : action === "sell" ? "action-sell" : ""}>
                      {actionLabel(action)}
                    </td>
                    <td>{row.tradeTime ?? "-"}</td>
                    <td className="max-w-[280px] whitespace-pre-wrap text-[11px]">
                      {expanded === key ? row.additionInfo ?? "-" : (row.additionInfo ?? "-").split("\n")[0]}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
