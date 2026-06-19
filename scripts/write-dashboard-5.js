const fs = require("fs");
const path = require("path");
const root = "C:/forestbond-clone/web/src";

function w(rel, content) {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), content.trimStart(), "utf8");
  console.log("wrote", rel);
}

w("components/dashboard/IntegratedDashboardClient.tsx", `"use client";

import { useEffect, useState } from "react";
import {
  DASHBOARD_SOURCES_KEY,
  DATA_SOURCES,
  MESSENGER_ROOMS,
} from "@/lib/dashboard-config";
import { useIntegratedFeed } from "@/hooks/useIntegratedFeed";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { PageHeader } from "@/components/PageHeader";
import { MessengerPanel } from "@/components/dashboard/widgets/MessengerPanel";
import { CompassTableWidget } from "@/components/dashboard/widgets/CompassTableWidget";
import { YieldGridWidget } from "@/components/dashboard/widgets/YieldGridWidget";
import { BondCalculatorWidget } from "@/components/dashboard/widgets/BondCalculatorWidget";
import { MarketSummaryWidget } from "@/components/dashboard/widgets/MarketSummaryWidget";
import { HeatmapMiniWidget } from "@/components/dashboard/widgets/HeatmapMiniWidget";

function loadSources(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(DASHBOARD_SOURCES_KEY);
    if (!raw) return Object.fromEntries(DATA_SOURCES.map((s) => [s.id, true]));
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(DATA_SOURCES.map((s) => [s.id, true]));
  }
}

export function IntegratedDashboardClient() {
  const feed = useIntegratedFeed();
  const [sources, setSources] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSources(loadSources());
  }, []);

  const toggleSource = (id: string) => {
    setSources((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(DASHBOARD_SOURCES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const mapEnabled = sources.map !== false;
  const dualEnabled = sources.dual !== false;
  const heatmapEnabled = sources.heatmap !== false;
  const marketEnabled = sources.market !== false;

  return (
    <>
      <PageHeader
        title="통합 터미널"
        description="1번 영상(K-Bond 메신저)의 실시간 호가를 카테고리별로 정리하고, 2번 영상(CHECK EXPERT+)처럼 수익률·단가계산·시장요약·히트맵을 한 화면에 연동합니다."
        actions={
          <>
            <ConnectionBadge status={feed.status.map} />
            <ConnectionBadge status={feed.status.dual} />
          </>
        }
      />

      <div className="source-bar">
        <span className="source-bar-label">연동 소스</span>
        {DATA_SOURCES.map((src) => (
          <label key={src.id} className="source-toggle">
            <input
              type="checkbox"
              checked={sources[src.id] ?? true}
              onChange={() => toggleSource(src.id)}
            />
            {src.label}
          </label>
        ))}
      </div>

      <div className="integrated-terminal">
        <section className="terminal-section">
          <h2 className="terminal-section-title">K-Bond 메신저 실시간 (1번 영상)</h2>
          <div className="terminal-grid terminal-grid-3">
            {mapEnabled ? (
              MESSENGER_ROOMS.map((room) => (
                <MessengerPanel
                  key={room.id}
                  title={room.title}
                  messages={feed.getRoomMessages(room.id)}
                />
              ))
            ) : (
              <div className="terminal-widget"><div className="empty-state">Map 소스가 꺼져 있습니다</div></div>
            )}
          </div>
        </section>

        <section className="terminal-section">
          <h2 className="terminal-section-title">Compass · 시장 데이터 (2번 영상)</h2>
          <div className="terminal-grid terminal-grid-2">
            {dualEnabled ? (
              <>
                <CompassTableWidget title="국채 Compass" rows={feed.govRows} />
                <CompassTableWidget title="통안 Compass" rows={feed.monRows} />
              </>
            ) : (
              <div className="terminal-widget"><div className="empty-state">Compass 소스가 꺼져 있습니다</div></div>
            )}
          </div>
          <div className="terminal-grid terminal-grid-3 mt-grid">
            {marketEnabled ? <YieldGridWidget /> : null}
            <BondCalculatorWidget />
            {marketEnabled ? <MarketSummaryWidget /> : null}
          </div>
          {heatmapEnabled ? (
            <div className="mt-grid">
              <HeatmapMiniWidget />
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
`);

// Update config nav
const configPath = "C:/forestbond-clone/web/src/lib/config.ts";
let config = fs.readFileSync(configPath, "utf8");
if (!config.includes("/dashboard")) {
  config = config.replace(
    "export const NAV_ITEMS: NavItem[] = [",
    "export const NAV_ITEMS: NavItem[] = [\n  { href: \"/dashboard\", label: \"Terminal\", icon: \"terminal\", section: \"Market\" },"
  );
  fs.writeFileSync(configPath, config, "utf8");
  console.log("updated config.ts");
}

// Update AppShell icon map
const appShellPath = "C:/forestbond-clone/web/src/components/AppShell.tsx";
let appShell = fs.readFileSync(appShellPath, "utf8");
if (!appShell.includes("LayoutDashboard")) {
  appShell = appShell.replace(
    "  BookMarked,\n} from \"lucide-react\";",
    "  BookMarked,\n  LayoutDashboard,\n} from \"lucide-react\";"
  );
  appShell = appShell.replace(
    "  \"book-open\": BookOpen,\n} as const;",
    "  \"book-open\": BookOpen,\n  terminal: LayoutDashboard,\n} as const;"
  );
  fs.writeFileSync(appShellPath, appShell, "utf8");
  console.log("updated AppShell.tsx");
}

// Update redirect
w("app/page.tsx", `import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
`);

console.log("done part 5");
