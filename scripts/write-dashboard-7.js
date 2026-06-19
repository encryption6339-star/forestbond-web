const fs = require("fs");
const p = "C:/forestbond-clone/web/src/components/ConnectionBadge.tsx";
const content = `"use client";

import type { ConnectionStatus } from "@/lib/types";

export function ConnectionBadge({ status, prefix }: { status: ConnectionStatus; prefix?: string }) {
  const label = status.connected
    ? status.mock
      ? "데모"
      : "실시간"
    : "연결 중";
  return (
    <div className={\`connection-badge\${status.connected ? " connected" : ""}\`}>
      <span className="connection-dot" />
      <span>{prefix ? \`\${prefix} \${label}\` : label}</span>
    </div>
  );
}
`;
fs.writeFileSync(p, content, "utf8");

const dash = fs.readFileSync("C:/forestbond-clone/web/src/components/dashboard/IntegratedDashboardClient.tsx", "utf8");
const updated = dash
  .replace("<ConnectionBadge status={feed.status.map} />", "<ConnectionBadge status={feed.status.map} prefix=\"Map\" />")
  .replace("<ConnectionBadge status={feed.status.dual} />", "<ConnectionBadge status={feed.status.dual} prefix=\"Compass\" />");
fs.writeFileSync("C:/forestbond-clone/web/src/components/dashboard/IntegratedDashboardClient.tsx", updated, "utf8");
console.log("updated badges");
