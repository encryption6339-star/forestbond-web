"use client";

import { DualBondTable } from "@/components/DualBondTable";
import { PageHeader } from "@/components/PageHeader";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { useDualSocket } from "@/hooks/useDualSocket";

export function LiveMarketClient() {
  const { govRows, monRows, connected, loading } = useDualSocket();

  return (
    <>
      <PageHeader
        title="Live Market"
        description="국고채(KTB)와 통안채(MSB) 실시간 호가·체결 테이블"
        actions={<ConnectionBadge status={{ connected, mock: false }} prefix="Dual WS" />}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <DualBondTable title="KTB · 국고채" rows={govRows} loading={loading} />
        <DualBondTable title="MSB · 통안채" rows={monRows} loading={loading} />
      </div>
    </>
  );
}
