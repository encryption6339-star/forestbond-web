"use client";

import type { ConnectionStatus } from "@/lib/types";

export function ConnectionBadge({ status, prefix }: { status: ConnectionStatus; prefix?: string }) {
  const label = status.connected
    ? status.mock
      ? "데모"
      : "실시간"
    : "연결 중";
  return (
    <div className={`connection-badge${status.connected ? " connected" : ""}`}>
      <span className="connection-dot" />
      <span>{prefix ? `${prefix} ${label}` : label}</span>
    </div>
  );
}
