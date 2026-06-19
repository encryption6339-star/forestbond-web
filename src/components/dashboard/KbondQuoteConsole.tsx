"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BondMessage, DualBondRow } from "@/lib/types";
import { formatKstTime, nowKstUnix } from "@/lib/utils";
import {
  benchAnchorLabel,
  buildMarketState,
  buildQuotesFromMessages,
  bucketOrder,
  countCrosses,
  findCrossIds,
  groupQuotes,
  marketToCeMetrics,
  yieldDeltaText,
  yieldDeltaTone,
  type MarketEntry,
  type QuoteAnchor,
  type QuoteMode,
} from "@/lib/quote-console";

export function KbondQuoteConsole({
  messages,
  govRows,
  monRows,
  mapConnected,
  dualConnected,
  fullPage = false,
}: {
  messages: BondMessage[];
  govRows: DualBondRow[];
  monRows: DualBondRow[];
  mapConnected: boolean;
  dualConnected: boolean;
  fullPage?: boolean;
}) {
  const [mode, setMode] = useState<QuoteMode>("auto");
  const [clock, setClock] = useState("--:--:--");
  const [tickFlash, setTickFlash] = useState(false);
  const anchors = useRef(new Map<string, QuoteAnchor>());
  const marketPrev = useRef<Record<string, MarketEntry>>({});
  const yieldPrev = useRef(new Map<string, number>());

  useEffect(() => {
    const tick = () => setClock(formatKstTime(nowKstUnix(), true));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const market = useMemo(() => {
    const next = buildMarketState(govRows, monRows, marketPrev.current);
    marketPrev.current = next;
    return next;
  }, [govRows, monRows]);

  useEffect(() => {
    setTickFlash(true);
    const id = window.setTimeout(() => setTickFlash(false), 180);
    return () => window.clearTimeout(id);
  }, [market.BM_3Y?.v, market.BM_10Y?.v, market.KTB3?.v]);

  const quotes = useMemo(
    () => buildQuotesFromMessages(messages, market, mode, anchors.current),
    [messages, market, mode]
  );
  const grouped = useMemo(() => groupQuotes(quotes), [quotes]);
  const order = useMemo(() => bucketOrder().filter((b) => grouped.has(b)), [grouped]);
  const crossIds = useMemo(() => findCrossIds(quotes), [quotes]);
  const crosses = useMemo(() => countCrosses(quotes), [quotes]);
  const ceRows = useMemo(() => marketToCeMetrics(market), [market]);

  const liveLabel = mapConnected || dualConnected ? "CHECK EXPERT · MAP 연동" : "연결 대기";
  const rootClass = fullPage ? "kbond-console kbond-console-full" : "kbond-console";

  return (
    <div className={rootClass}>
      <header className="kbond-console-header">
        <div className="kbond-console-brand">
          <div className="kbond-console-eyebrow">K-BOND × CHECK EXPERT BRIDGE</div>
          <h1 className="kbond-console-title">
            실시간 호가 정리 · <span>자동 재호가</span> 콘솔
          </h1>
          <p className="kbond-console-sub">
            메신저 호가를 만기 구간별로 모으고, 장 상황(국채선물·국고 금리)에 따라 호가를 자동으로 따라 움직입니다.
          </p>
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
            <>장 상황 변화에 맞춰 모든 호가 금리·단가가 <b className="good">자동 추종</b>됩니다.</>
          ) : (
            <>시세는 계속 변하지만 호가는 <b className="bad">게시 시점에 정지</b> — 사람이 일일이 눈으로 좇아 고쳐야 합니다.</>
          )}
        </div>
      </div>

      <div className="kbond-console-grid">
        <aside className="kbond-console-card">
          <h2>
            Check Expert 실시간 <span className={`badge ${tickFlash ? "flash" : ""}`}>tick</span>
          </h2>
          <div className="kbond-console-ce-sub">국채선물 · 국고 벤치마크 금리(Compass WS)</div>
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
            <div className="t">K-bond 통합 호가판 · 만기 구간별</div>
            <div className={`alert ${crosses === 0 ? "zero" : ""}`}>체결가능 {Math.round(crosses)}건</div>
          </div>
          {order.length === 0 ? <div className="kbond-console-empty">Map WS 호가 수신 대기 중…</div> : null}
          {order.map((bucket) => {
            const items = grouped.get(bucket) ?? [];
            const offers = items.filter((q) => q.side === "O").sort((a, b) => (a.liveY ?? 0) - (b.liveY ?? 0));
            const bids = items.filter((q) => q.side === "B").sort((a, b) => (b.liveY ?? 0) - (a.liveY ?? 0));
            const rows = [...offers, ...bids];
            return (
              <div key={bucket} className="kbond-console-bucket">
                <div className="bk-tag">
                  {bucket} 구간 <span className="cnt">· 팔자 {offers.length} / 사자 {bids.length}</span>
                </div>
                {rows.map((q) => {
                  const isCross = crossIds.has(q.id);
                  const tone = yieldDeltaTone(q.liveY, q.quotedY);
                  const prev = yieldPrev.current.get(q.id);
                  const flash = prev != null && q.liveY != null && Math.abs(prev - q.liveY) > 0.0005;
                  if (q.liveY != null) yieldPrev.current.set(q.id, q.liveY);
                  return (
                    <div key={q.id} className={`kbond-console-q ${isCross ? "cross" : ""}`}>
                      <span className={`side ${q.side}`}>{q.side === "O" ? "팔자" : "사자"}</span>
                      <span className="nm">
                        {q.name}
                        {isCross ? <span className="chip">체결가능</span> : null}
                        <span className="anchor">
                          {benchAnchorLabel(q.benchKey, q.spreadBp)} · {q.dealer}
                        </span>
                      </span>
                      <span className="sz num">{q.size}</span>
                      <span className={`yld num ${tone} ${flash ? (tone === "up" ? "flash-up" : tone === "dn" ? "flash-dn" : "") : ""}`}>
                        {q.liveY != null ? `${q.liveY.toFixed(3)}%` : q.yieldText}
                        <span className="delta">{yieldDeltaText(q.liveY, q.quotedY)}</span>
                      </span>
                      <span className="px num">{q.livePx != null ? q.livePx.toFixed(2) : "--"}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>
      </div>

      <div className="kbond-console-legend">
        <span><i className="up" />금리 상승(채권 약세)</span>
        <span><i className="dn" />금리 하락(채권 강세)</span>
        <span><i className="gold" />벤치마크 앵커(스프레드 고정)</span>
        <span><i className="mint" />체결가능(크로스)</span>
      </div>

      {fullPage ? (
        <div className="kbond-console-foot">
          <b>동작 방식</b> — 각 호가는 게시 순간의 “국고 만기별 금리 + 스프레드(bp)”로 고정(anchor)됩니다.
          Check Expert 금리가 틱마다 변하면 호가 금리 = <span className="num">기준금리 + 고정스프레드</span> 로 자동 재계산되고, 단가도 함께 갱신됩니다.
          <b> 수동(기존 방식)</b> 토글을 켜면 시세는 계속 변하지만 호가는 게시 시점에 멈춰 있어, 시간이 지날수록 실제 시장과 벌어지는 정도(스테일)를 직접 확인할 수 있습니다.
        </div>
      ) : null}
    </div>
  );
}
