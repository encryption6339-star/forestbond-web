"use client";

const YIELDS = [
  { tenor: "2Y", code: "24-8", yield: 2.612, chg: -0.003 },
  { tenor: "3Y", code: "25-4", yield: 2.743, chg: 0.001 },
  { tenor: "5Y", code: "25-2", yield: 2.981, chg: -0.002 },
  { tenor: "10Y", code: "24-3", yield: 3.195, chg: 0.000 },
  { tenor: "20Y", code: "23-6", yield: 3.412, chg: 0.004 },
  { tenor: "30Y", code: "22-1", yield: 3.388, chg: -0.001 },
  { tenor: "50Y", code: "20-1", yield: 3.205, chg: 0.002 },
];

export function YieldGridWidget() {
  return (
    <div className="terminal-widget">
      <div className="terminal-widget-header">국채 수익률 (민평)</div>
      <div className="table-scroll">
        <table className="data-table compact">
          <thead><tr><th>만기</th><th>종목</th><th>수익률</th><th>변동</th></tr></thead>
          <tbody>
            {YIELDS.map((y) => (
              <tr key={y.tenor}>
                <td>{y.tenor}</td><td>{y.code}</td>
                <td>{y.yield.toFixed(3)}%</td>
                <td className={y.chg >= 0 ? "text-up" : "text-down"}>{y.chg >= 0 ? "+" : ""}{y.chg.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
