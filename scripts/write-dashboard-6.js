const fs = require("fs");
const cssPath = "C:/forestbond-clone/web/src/app/globals.css";
const extra = `

/* Integrated Terminal (Video 1 + Video 2) */
.integrated-terminal { display: flex; flex-direction: column; gap: 20px; }
.terminal-section-title { margin: 0 0 10px; font-size: 14px; font-weight: 600; color: var(--color-brand); }
.terminal-grid { display: grid; gap: 8px; }
.terminal-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.terminal-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.mt-grid { margin-top: 8px; }
@media (max-width: 1100px) { .terminal-grid-3 { grid-template-columns: 1fr; } .terminal-grid-2 { grid-template-columns: 1fr; } }

.terminal-widget {
  display: flex; flex-direction: column; min-height: 280px; max-height: 420px;
  border: 1px solid color-mix(in srgb, var(--card-foreground) 15%, var(--card-border));
  border-radius: 8px; overflow: hidden; background: #f5f5f5; color: #111;
}
.terminal-widget-header {
  padding: 6px 10px; font-size: 12px; font-weight: 700;
  background: linear-gradient(180deg, #dce6f2 0%, #c5d4e8 100%);
  border-bottom: 1px solid #9ab; color: #1a2744; cursor: default;
}
.messenger-panel { background: #fff; }
.messenger-toolbar { display: flex; gap: 8px; align-items: center; padding: 6px 8px; border-bottom: 1px solid #ddd; background: #eef2f7; }
.messenger-toolbar input { flex: 1; border: 1px solid #bbb; border-radius: 4px; padding: 4px 8px; font-size: 12px; }
.messenger-count { font-size: 11px; color: #666; white-space: nowrap; }
.messenger-feed { flex: 1; overflow-y: auto; font-size: 12px; line-height: 1.45; font-family: "Malgun Gothic", "Segoe UI", sans-serif; }
.messenger-row { padding: 2px 6px; border-bottom: 1px solid rgba(0,0,0,0.06); cursor: pointer; word-break: break-all; }
.messenger-row:hover { filter: brightness(0.97); }
.messenger-meta { font-weight: 600; }
.messenger-company { color: #444; }
.messenger-status { padding: 4px 8px; font-size: 11px; background: #eef2f7; border-top: 1px solid #ddd; color: #555; }
.copied-tag { color: #059669; font-size: 11px; }

.source-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 12px; padding: 10px 12px; border: 1px solid var(--card-border); border-radius: 8px; background: var(--surface-soft); }
.source-bar-label { font-size: 12px; color: var(--card-muted); margin-right: 4px; }
.source-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--foreground); cursor: pointer; }

.table-scroll { flex: 1; overflow: auto; background: #fff; }
.data-table.compact th, .data-table.compact td { padding: 4px 6px; font-size: 11px; }
.text-up { color: #dc2626; font-weight: 600; }
.text-down { color: #2563eb; font-weight: 600; }
.truncate { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.calc-form { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px; background: #fff; flex: 1; }
.calc-form label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #555; }
.calc-form input { border: 1px solid #bbb; border-radius: 4px; padding: 4px 6px; font-size: 12px; }
.calc-result { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px 10px; background: #eef2f7; border-top: 1px solid #ddd; font-size: 12px; }
.calc-result strong { display: block; font-size: 16px; color: #111; }

.market-list { flex: 1; overflow: auto; background: #fff; }
.market-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 12px; }

.heatmap-mini-scroll { overflow: auto; background: #fff; flex: 1; }
.heatmap-mini-table { width: 100%; border-collapse: collapse; font-size: 10px; }
.heatmap-mini-table th, .heatmap-mini-table td { border: 1px solid #ddd; padding: 4px; text-align: center; }
.heatmap-mini-table th { background: #eef2f7; color: #333; }
`;
if (!fs.readFileSync(cssPath, "utf8").includes("integrated-terminal")) {
  fs.appendFileSync(cssPath, extra, "utf8");
  console.log("appended globals.css");
}

// fix dual status type
const hookPath = "C:/forestbond-clone/web/src/hooks/useIntegratedFeed.ts";
let hook = fs.readFileSync(hookPath, "utf8");
hook = hook.replace("dual: { connected: dualConnected, mock: false }", "dual: { connected: dualConnected, mock: false as const }");
fs.writeFileSync(hookPath, hook, "utf8");
console.log("done css");
