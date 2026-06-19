const fs = require("fs");
const path = require("path");
const root = "C:/forestbond-clone/web/src";

function w(rel, content) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trimStart(), "utf8");
  console.log("wrote", rel);
}

// dashboard-config.ts
w("lib/dashboard-config.ts", `
export type WidgetType =
  | "messenger"
  | "compass-table"
  | "yield-grid"
  | "bond-calculator"
  | "market-summary"
  | "heatmap-mini"
  | "category-feed";

export interface MessengerRoom {
  id: string;
  title: string;
  categories: string[];
}

export interface DashboardWidgetDef {
  id: string;
  type: WidgetType;
  title: string;
  roomId?: string;
  table?: "gov" | "mon";
  category?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export const MESSENGER_ROOMS: MessengerRoom[] = [
  { id: "ktb", title: "[채권] 국고채", categories: ["gov"] },
  { id: "msb-fin", title: "[채권] 통안/금융채", categories: ["mon", "indust", "bank"] },
  { id: "ktb-etc", title: "[채권] 국고/기타", categories: ["gov", "etc", "Info"] },
  { id: "general", title: "[채권] 일반/특수", categories: ["comp", "public", "perp", "FRN", "CD"] },
];

export const DATA_SOURCES = [
  { id: "map", label: "막무가내/Map WS", ws: "wss://ws.forestbond.co.kr/ws/map" },
  { id: "dual", label: "Compass Dual WS", ws: "wss://ws.forestbond.co.kr/ws/dual" },
  { id: "heatmap", label: "Heatmap API", ws: null },
  { id: "market", label: "시장 요약 (데모)", ws: null },
] as const;

export const DEFAULT_DASHBOARD_LAYOUT: DashboardWidgetDef[] = [
  { id: "room-ktb", type: "messenger", title: "[채권] 국고채", roomId: "ktb", x: 0, y: 0, w: 4, h: 5, minW: 3, minH: 3 },
  { id: "room-msb", type: "messenger", title: "[채권] 통안/금융채", roomId: "msb-fin", x: 4, y: 0, w: 4, h: 5, minW: 3, minH: 3 },
  { id: "room-general", type: "messenger", title: "[채권] 일반/특수", roomId: "general", x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 3 },
  { id: "compass-gov", type: "compass-table", title: "국채 Compass", table: "gov", x: 0, y: 5, w: 6, h: 4, minW: 4, minH: 3 },
  { id: "compass-mon", type: "compass-table", title: "통안 Compass", table: "mon", x: 6, y: 5, w: 6, h: 4, minW: 4, minH: 3 },
  { id: "yield-grid", type: "yield-grid", title: "국채 수익률", x: 0, y: 9, w: 4, h: 4, minW: 3, minH: 3 },
  { id: "bond-calc", type: "bond-calculator", title: "채권단가계산", x: 4, y: 9, w: 4, h: 4, minW: 3, minH: 3 },
  { id: "market-summary", type: "market-summary", title: "시장 요약", x: 8, y: 9, w: 4, h: 4, minW: 3, minH: 3 },
  { id: "heatmap-mini", type: "heatmap-mini", title: "히트맵", x: 0, y: 13, w: 12, h: 4, minW: 6, minH: 3 },
];

export const DASHBOARD_LAYOUT_KEY = "forestbond-dashboard-layout-v1";
export const DASHBOARD_SOURCES_KEY = "forestbond-dashboard-sources-v1";
`);

console.log("done part 1");
