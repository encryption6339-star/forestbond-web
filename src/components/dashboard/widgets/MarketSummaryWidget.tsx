"use client";

const ITEMS = [
  { name: "USD/KRW", value: "1,382.50", chg: "+3.20", up: true },
  { name: "JPY/KRW", value: "926.12", chg: "-0.85", up: false },
  { name: "Call 금리", value: "3.50%", chg: "0.00", up: true },
  { name: "CD 91D", value: "3.48%", chg: "-0.01", up: false },
  { name: "3년국채F", value: "107.45", chg: "+0.12", up: true },
  { name: "10년국채F", value: "112.08", chg: "-0.05", up: false },
];

export function MarketSummaryWidget() {
  return (
    <div className="terminal-widget">
      <div className="terminal-widget-header">시장 요약</div>
      <div className="market-list">
        {ITEMS.map((item) => (
          <div key={item.name} className="market-row">
            <span>{item.name}</span>
            <span>{item.value}</span>
            <span className={item.up ? "text-up" : "text-down"}>{item.chg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
