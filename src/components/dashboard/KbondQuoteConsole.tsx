"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BondMessage, DualBondRow } from "@/lib/types";
import { formatKstTime, nowKstUnix } from "@/lib/utils";
import {
  buildCeMetrics,
  buildQuotesFromMessages,
  bucketOrder,
  countCrosses,
  groupQuotes,
  type ParsedQuote,
} from "@/lib/quote-console";

type Mode = "auto" | "manual";

function applyMode(quotes: ParsedQuote[], mode: Mode, frozen: Map<string, number>): ParsedQuote[] {
  return quotes.map((q) => {
    const key = q.id;
    if (q.yieldNum == null) return q;
    if (mode === "manual") {
      if (!frozen.has(key)) frozen.set(key, q.yieldNum);
      const y = frozen.get(key)!;
      return { ...q, quotedY: y, liveY: y, prevY: y };
    }
    frozen.delete(key);
    return q;
  });
}

export function KbondQuoteConsole({
  messages,
  govRows,
  monRows,
  mapConnected,
  dualConnected,
}: {
  messages: BondMessage[];
  govRows: DualBondRow[];
  monRows: DualBondRow[];
  mapConnected: boolean;
  dualConnected: boolean;
}) {
  const [mode, setMode] = useState<Mode>("auto");
  const [clock, setClock] = useState("--:--:--");
  const cePrev = useRef(new Map<string, number>());
  const frozenY = useRef(new Map<string, number>());

  useEffect(() => {
    const tick = () => setClock(formatKstTime(nowKstUnix(), true));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const baseQuotes = useMemo(() => buildQuotesFromMessages(messages), [messages]);
  const quotes = useMemo(() => applyMode(baseQuotes, mode, frozenY.current), [baseQuotes, mode]);
  const grouped = useMemo(() => groupQuotes(quotes), [quotes]);
  const order = useMemo(() => bucketOrder().filter((b) => grouped.has(b)), [grouped]);
  const crosses = useMemo(() => countCrosses(quotes), [quotes]);
  const ceRows = useMemo(() => buildCeMetrics(govRows, monRows, cePrev.current), [govRows, monRows, quotes.length]);

  const liveLabel = mapConnected || dualConnected ? "CHECK EXPERT · MAP 연동" : "연결 대기";

  return (
    <div className="kbond-console">
      <header className="kbond-console-header">
        <div className="kbond-console-brand">
          <div className="kbond-console-eyebrow">K-BOND × CHECK EXPERT BRIDGE</div>
          <h1 className="kbond-console-title">
            실시간 호가 정리 · <span>자동 재호가</span> 콘솔
          </h1>
          <p className="kbond-console-sub">막무가내 메신저 호가를 만기·섹터별로 모아 Check Expert 시세와 함께 확인합니다.</p>
        </div>
        <div className="kbond-console-status">
          <span className="kbond-console-clock num">{clock}</span>
          <span className="kbond-console-live">
            <i /> {liveLabel}
          </span>
        </div>
      </header>

      <div className="kbond-console-modebar">
        <div className="kbond-console-toggle">
          <button type="button" className={mode === "auto" ? "on" : undefined} onClick={() => setMode("auto")}>
            자동 재호가 ON
          </button>
          <button type="button" className={mode === "manual" ? "on" : undefined} onClick={() => setMode("manual")}>
            수동(기존 방식)
          </button>
        </div>
        <div className="kbond-console-modenote">
          {mode === "auto" ? (
            <>장 상황 변화에 맞춰 호가 금리가 <b className="good">실시간 추종</b>됩니다.</>
          ) : (
            <>시세는 변하지만 호가는 <b className="bad">게시 시점에 정지</b>됩니다.</>
          )}
        </div>
      </div>

      <div className="kbond-console-grid">
        <aside className="kbond-console-card">
          <h2>
            Check Expert 실시간 <span className="badge">tick</span>
          </h2>
          <div className="kbond-console-ce-sub">국채선물 · 국고 · 통안 벤치마크(Compass WS)</div>
          {ceRows.length === 0 ? <div className="kbond-console-empty">Compass 데이터 대기 중…</div> : null}
          {ceRows.map((row) => (
            <div key={row.key} className="kbond-console-ce-row">
              <div className="lab">
                <b>{row.label}</b>
              </div>
              <div className="ce-val">
                <span className={`v num ${row.tone}`}>{row.value}</span>
                <span className={`d num ${row.tone}`}>{row.delta}</span>
              </div>
            </div>
          ))}
        </aside>

        <section className="kbond-console-card">
          <div className="kbond-console-board-head">
            <div className="t">K-bond 통합 호가판 · 구간별</div>
            <div className={`alert ${crosses === 0 ? "zero" : ""}`}>체결가능 {crosses}건</div>
          </div>
          {order.length === 0 ? <div className="kbond-console-empty">막무가내/Map WS 호가 수신 대기 중…</div> : null}
          {order.map((bucket) => {
            const items = grouped.get(bucket) ?? [];
            const offers = items.filter((q) => q.side === "O");
            const bids = items.filter((q) => q.side === "B");
            const rows = [...offers, ...bids];
            return (
              <div key={bucket} className="kbond-console-bucket">
                <div className="bk-tag">
                  {bucket} 구간 <span className="cnt">· 팔자 {offers.length} / 사자 {bids.length}</span>
                </div>
                {rows.map((q) => (
                  <div key={q.id} className="kbond-console-q">
                    <span className={`side ${q.side}`}>{q.side === "O" ? "팔자" : "사자"}</span>
                    <span className="nm">
                      {q.name}
                      <span className="anchor">{q.dealer}</span>
                    </span>
                    <span className="sz num">{q.size}</span>
                    <span className="yld num">{q.yieldText}</span>
                    <span className="px num">{q.tradeTime || "--:--"}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </section>
      </div>

      <div className="kbond-console-legend">
        <span><i className="up" />금리 상승(채권 약세)</span>
        <span><i className="dn" />금리 하락(채권 강세)</span>
        <span><i className="gold" />벤치마크 앵커</span>
        <span><i className="mint" />체결가능(크로스)</span>
      </div>
    </div>
  );
}
