"use client";

import type { ConnectionStatus } from "@/lib/types";

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  return (
    <div className={`connection-badge${status.connected ? " connected" : ""}`}>
      <span className="connection-dot" />
      <span>{status.connected ? (status.mock ? "데모 데이터" : "실시간 연결") : "연결 중..."}</span>
    </div>
  );
}
