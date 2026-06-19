"use client";

import { useMemo, useState } from "react";

export function BondCalculatorWidget() {
  const [face, setFace] = useState("10000");
  const [coupon, setCoupon] = useState("3.5");
  const [ytm, setYtm] = useState("3.2");
  const [years, setYears] = useState("3");

  const result = useMemo(() => {
    const f = Number(face) || 10000;
    const c = Number(coupon) / 100;
    const y = Number(ytm) / 100;
    const n = Number(years) || 1;
    if (y <= 0) return { price: f, accrued: 0 };
    let pv = 0;
    for (let t = 1; t <= n; t++) pv += (f * c) / Math.pow(1 + y, t);
    pv += f / Math.pow(1 + y, n);
    return { price: Math.round(pv), accrued: Math.round(f * c / 2) };
  }, [face, coupon, ytm, years]);

  return (
    <div className="terminal-widget">
      <div className="terminal-widget-header">채권단가계산</div>
      <div className="calc-form">
        <label>액면<input value={face} onChange={(e) => setFace(e.target.value)} /></label>
        <label>표면금리(%)<input value={coupon} onChange={(e) => setCoupon(e.target.value)} /></label>
        <label>만기(년)<input value={years} onChange={(e) => setYears(e.target.value)} /></label>
        <label>수익률(%)<input value={ytm} onChange={(e) => setYtm(e.target.value)} /></label>
      </div>
      <div className="calc-result">
        <div><span>단가</span><strong>{result.price.toLocaleString()}</strong></div>
        <div><span>이자(반기)</span><strong>{result.accrued.toLocaleString()}</strong></div>
      </div>
    </div>
  );
}
