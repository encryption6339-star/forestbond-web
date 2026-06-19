const fs = require("fs");
const utilsPath = "C:/forestbond-clone/web/src/lib/utils.ts";
let utils = fs.readFileSync(utilsPath, "utf8");
if (!utils.includes("getMessengerRowStyle")) {
  utils += `

export function getMessengerRowStyle(msg: BondMessage): { bg: string; fg: string } {
  const text = msg.message ?? "";
  if (/사자|매수/.test(text)) return { bg: "#fff3a0", fg: "#111111" };
  if (/팔자|매도/.test(text)) return { bg: "#a8f0ff", fg: "#111111" };
  if (msg.category === "gov") return { bg: "#fffacd", fg: "#111111" };
  if (msg.category === "mon" || msg.category === "indust") return { bg: "#d4ffd4", fg: "#111111" };
  if (msg.category === "comp" || msg.category === "public") return { bg: "#ffd4f4", fg: "#111111" };
  if (msg.trade_name.trim() && !msg.trade_name.includes("**")) return { bg: "#ececec", fg: "#111111" };
  return { bg: "transparent", fg: "var(--foreground)" };
}

export const heatColor = heatmapColor;
export const todayIso = () => toYmd(new Date());
`;
  fs.writeFileSync(utilsPath, utils, "utf8");
  console.log("patched utils.ts");
}

// fix HeatmapMiniWidget import - already uses heatColor/todayIso aliases

const fs2 = require("fs");
const path = require("path");
const root = "C:/forestbond-clone/web/src";
function w(rel, content) { fs2.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true}); fs2.writeFileSync(path.join(root,rel), content.trimStart(), "utf8"); console.log("wrote", rel); }

w("components/dashboard/IntegratedDashboardClient.tsx", `"use client";

import { useEffect, useRef, useState } from "react";
import { GridStack } from "gridstack";
import {
  DASHBOARD_LAYOUT_KEY,
  DASHBOARD_SOURCES_KEY,
  DATA_SOURCES,
  DEFAULT_DASHBOARD_LAYOUT,
  type DashboardWidgetDef,
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

function loadLayout(): DashboardWidgetDef[] {
  try {
    const raw = localStorage.getItem(DASHBOARD_LAYOUT_KEY);
    if (!raw) return DEFAULT_DASHBOARD_LAYOUT;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_DASHBOARD_LAYOUT;
  } catch {
    return DEFAULT_DASHBOARD_LAYOUT;
  }
}

function loadSources(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(DASHBOARD_SOURCES_KEY);
    if (!raw) return Object.fromEntries(DATA_SOURCES.map((s) => [s.id, true]));
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(DATA_SOURCES.map((s) => [s.id, true]));
  }
}

function renderWidget(
  def: DashboardWidgetDef,
  feed: ReturnType<typeof useIntegratedFeed>
) {
  switch (def.type) {
    case "messenger":
      return (
        <MessengerPanel
          title={def.title}
          messages={def.roomId ? feed.getRoomMessages(def.roomId) : []}
        />
      );
    case "compass-table":
      return (
        <CompassTableWidget
          title={def.title}
          rows={def.table === "mon" ? feed.monRows : feed.govRows}
        />
      );
    case "yield-grid":
      return <YieldGridWidget />;
    case "bond-calculator":
      return <BondCalculatorWidget />;
    case "market-summary":
      return <MarketSummaryWidget />;
    case "heatmap-mini":
      return <HeatmapMiniWidget />;
    default:
      return <div className="empty-state">위젯</div>;
  }
}

export function IntegratedDashboardClient() {
  const feed = useIntegratedFeed();
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstance = useRef<GridStack | null>(null);
  const [sources, setSources] = useState<Record<string, boolean>>({});
  const [layout, setLayout] = useState<DashboardWidgetDef[]>(DEFAULT_DASHBOARD_LAYOUT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSources(loadSources());
    setLayout(loadLayout());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !gridRef.current) return;
    gridInstance.current?.destroy(false);
    const grid = GridStack.init(
      {
        column: 12,
        cellHeight: 72,
        margin: 6,
        float: true,
        animate: true,
        draggable: { handle: ".terminal-widget-header" },
        resizable: { handles: "se" },
      },
      gridRef.current
    );
    gridInstance.current = grid;
    grid.removeAll(false);
    layout.forEach((item) => {
      const el = document.createElement("div");
      el.className = "grid-stack-item";
      el.setAttribute("gs-id", item.id);
      el.innerHTML = '<div class="grid-stack-item-content terminal-widget-shell"></div>';
      grid.addWidget(el, {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW ?? 2,
        minH: item.minH ?? 2,
        id: item.id,
      });
    });
    grid.on("change", () => {
      const saved = grid.save(false).map((node) => {
        const def = layout.find((d) => d.id === node.id) ?? DEFAULT_DASHBOARD_LAYOUT[0];
        return {
          ...def,
          id: String(node.id),
          x: node.x ?? 0,
          y: node.y ?? 0,
          w: node.w ?? 4,
          h: node.h ?? 4,
        };
      });
      localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(saved));
      setLayout(saved);
    });
    return () => {
      grid.destroy(false);
      gridInstance.current = null;
    };
  }, [ready]);

  useEffect(() => {
    if (!gridRef.current) return;
    layout.forEach((def) => {
      const shell = gridRef.current?.querySelector(
        \`.grid-stack-item[gs-id="\${def.id}"] .terminal-widget-shell\`
      );
      if (!shell) return;
      const root = document.createElement("div");
      root.className = "terminal-widget-root";
      shell.innerHTML = "";
      shell.appendChild(root);
      import("react-dom/client").then(({ createRoot }) => {
        const r = createRoot(root);
        r.render(renderWidget(def, feed) as React.ReactElement);
      });
    });
  }, [layout, feed.messages, feed.govRows, feed.monRows]);

  const toggleSource = (id: string) => {
    setSources((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(DASHBOARD_SOURCES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetLayout = () => {
    localStorage.removeItem(DASHBOARD_LAYOUT_KEY);
    setLayout(DEFAULT_DASHBOARD_LAYOUT);
    window.location.reload();
  };

  return (
    <>
      <PageHeader
        title="통합 터미널"
        description="K-Bond 메신저 실시간 호가와 Compass·히트맵·시장 데이터를 한 화면에서 모니터링합니다. (CHECK EXPERT+ 스타일)"
        actions={
          <>
            <ConnectionBadge
              connected={feed.status.map.connected || feed.status.dual.connected}
              mock={feed.status.map.mock}
              label={
                feed.status.map.connected
                  ? feed.status.map.mock
                    ? "Map 데모"
                    : "실시간"
                  : "연결 중"
              }
            />
            <button type="button" className="btn" onClick={resetLayout}>레이아웃 초기화</button>
          </>
        }
      />

      <div className="source-bar">
        <span className="source-bar-label">데이터 소스</span>
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

      <div className="grid-stack dashboard-grid" ref={gridRef} />
    </>
  );
}
`);

w("app/(dashboard)/dashboard/page.tsx", `import { IntegratedDashboardClient } from "@/components/dashboard/IntegratedDashboardClient";

export default function DashboardPage() {
  return <IntegratedDashboardClient />;
}
`);

console.log("done part 4");
