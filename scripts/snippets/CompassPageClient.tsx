"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DualBondTable } from "@/components/DualBondTable";
import { PageHeader } from "@/components/PageHeader";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { useDualSocket } from "@/hooks/useDualSocket";

export function CompassPageClient() {
  const { govRows, monRows, loading, connected } = useDualSocket();
  const [tipsOpen, setTipsOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="KTB / MSB Compass"
        description="국채(KTB)와 통안채(MSB)의 실시간 호가와 체결 정보를 한눈에 모니터링합니다."
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
                  <li>접기 버튼(오른쪽에 위치한 화살표 버튼)을 누르시면 테이블만 보실 수 있습니다.</li>
                  <li>테이블 오른쪽 상단 플러스 버튼을 누르시면 해당 테이블만 새 창에서 띄워집니다.</li>
                  <li>데이터를 클릭하시면 더욱 자세한 정보를 확인하실 수 있습니다.</li>
                </ul>
              </div>
            ) : null}
          </>
        }
      />
      <section className="grid gap-4 lg:grid-cols-2 min-h-[420px]">
        <DualBondTable title="KTB (국채)" rows={govRows} loading={loading} />
        <DualBondTable title="MSB (통안채)" rows={monRows} loading={loading} />
      </section>
    </>
  );
}
