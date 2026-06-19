"use client";

import type { DualBondRow } from "@/lib/types";

export function CompassTableWidget({ title, rows }: { title: string; rows: DualBondRow[] }) {
  return (
    <div className="terminal-widget">
      <div className="terminal-widget-header">{title}</div>
      <div className="table-scroll">
        <table className="data-table compact">
          <thead>
            <tr>
              <th>종목</th><th>민평</th><th>매매</th><th>시간</th><th>호가</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 80).map((row, i) => (
              <tr key={`${row.bondCD}-${i}`}>
                <td>{row.bondCD}</td>
                <td>{row.privateEval ?? "-"}</td>
                <td className={row.action === "buy" ? "text-up" : row.action === "sell" ? "text-down" : ""}>
                  {row.action === "buy" ? "사자" : row.action === "sell" ? "팔자" : "-"}
                </td>
                <td>{row.tradeTime ?? "-"}</td>
                <td className="truncate">{row.additionInfo?.split("\n")[0] ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
