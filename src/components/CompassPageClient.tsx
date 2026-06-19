"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DualBondTable } from "@/components/DualBondTable";
import { PageHeader } from "@/components/PageHeader";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { useDualSocket } from "@/hooks/useDualSocket";
import { httpGet } from "@/lib/api";

type KbondTradeRow = Record<string, unknown>;
type KbondDetailRow = Record<string, unknown>;

type TabId = "live" | "kbond_trade" | "kbond_detail";

export function CompassPageClient() {
  const { govRows, monRows, loading, connected } = useDualSocket();
  const [tipsOpen, setTipsOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("live");
  const [tradeRows, setTradeRows] = useState<KbondTradeRow[]>([]);
  const [detailRows, setDetailRows] = useState<KbondDetailRow[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const loadApiTab = useCallback(async (next: TabId) => {
    if (next === "live") return;
    setApiLoading(true);
    setApiError("");
    try {
      if (next === "kbond_trade") {
        const data = await httpGet<KbondTradeRow[] | { data?: KbondTradeRow[] }>("/api/kbond_trade");
        setTradeRows(Array.isArray(data) ? data : (data.data ?? []));
      } else {
        const data = await httpGet<KbondDetailRow[] | { data?: KbondDetailRow[] }>("/api/kbond_detail");
        setDetailRows(Array.isArray(data) ? data : (data.data ?? []));
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "데이터를 불러오는 문제가 발생했습니다.");
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "live") return;
    void loadApiTab(tab);
  }, [tab, loadApiTab]);

  return (
    <>
      <PageHeader
        title="KTB / MSB Compass"
        description="국채(KTB)와 통안채(MSB) 실시간 호가·체결. REST 탭으로 kbond_trade / kbond_detail API를 조회합니다."
        actions={<ConnectionBadge status={{ connected, mock: false }} />}
        below={
          <>
            <button type="button" className="tips-toggle" onClick={() => setTipsOpen((v) => !v)}>
              <span>화면 사용 팁</span>
              <ChevronDown size={16} style={{ transform: tipsOpen ? "rotate(180deg)" : undefined }} />
            </button>
            {tipsOpen ? (
              <div className="tips-panel">
                <ul>
                  <li>Live 탭은 WebSocket dual 피드를 사용합니다.</li>
                  <li>kbond_trade / kbond_detail 탭은 forestbond REST API 프록시 데이터입니다.</li>
                  <li>행을 클릭하면 상세 정보를 확인할 수 있습니다 (DualBondTable).</li>
                </ul>
              </div>
            ) : null}
          </>
        }
      />

      <div className="public-issue-tabs mb-4">
        <button type="button" className={tab === "live" ? "active" : undefined} onClick={() => setTab("live")}>
          Live (WS)
        </button>
        <button type="button" className={tab === "kbond_trade" ? "active" : undefined} onClick={() => setTab("kbond_trade")}>
          kbond_trade
        </button>
        <button type="button" className={tab === "kbond_detail" ? "active" : undefined} onClick={() => setTab("kbond_detail")}>
          kbond_detail
        </button>
      </div>

      {tab === "live" ? (
        <section className="grid gap-4 lg:grid-cols-2 min-h-[420px]">
          <DualBondTable title="KTB (국채)" rows={govRows} loading={loading} />
          <DualBondTable title="MSB (통안)" rows={monRows} loading={loading} />
        </section>
      ) : null}

      {tab !== "live" ? (
        <section className="panel-card">
          {apiError ? <p className="text-red-400 text-sm mb-3">{apiError}</p> : null}
          {apiLoading ? <p className="empty-state">불러오는 중…</p> : null}
          {!apiLoading ? (
            <div className="table-scroll">
              <table className="data-table compact">
                <thead>
                  <tr>
                    {Object.keys((tab === "kbond_trade" ? tradeRows[0] : detailRows[0]) ?? { col: "" }).map((k) => (
                      <th key={k}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(tab === "kbond_trade" ? tradeRows : detailRows).map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, i) => (
                        <td key={i}>{String(val ?? "-")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {(tab === "kbond_trade" ? tradeRows : detailRows).length === 0 && !apiLoading ? (
                <p className="empty-state">표시할 행이 없습니다.</p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}