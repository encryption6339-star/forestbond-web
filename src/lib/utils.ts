import type { BondInfo, BondMessage, DualBondRow, QuoteOptions } from "./types";

const CREDIT_NUM: Record<string, number> = {
  AAA: 1,
  "AA+": 2,
  AA: 3,
  "AA-": 4,
  "A+": 5,
  A: 6,
  "A-": 7,
  "BBB+": 8,
  BBB: 9,
  "BBB-": 10,
  "BB+": 11,
  BB: 12,
  "BB-": 13,
  "B+": 14,
  B: 15,
  "B-": 16,
  "CCC+": 17,
  CCC: 18,
  "CCC-": 19,
  CC: 20,
  C: 21,
  D: 22,
};

const CREDIT_LABEL: Record<number, string> = Object.fromEntries(
  Object.entries(CREDIT_NUM).map(([k, v]) => [v, k])
);


export const KST_TIMEZONE = "Asia/Seoul";

export function formatKstTime(unixSec: number, withSeconds = true): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: false,
  }).format(new Date(unixSec * 1000));
}

export function formatKstDateTime(value: Date | string | number): string {
  const date =
    typeof value === "number"
      ? new Date(value > 1e12 ? value : value * 1000)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value ?? "");
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatKstDate(value: Date | string | number): string {
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value ?? "");
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function todayKstYmd(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KST_TIMEZONE }).format(new Date()).replace(/-/g, "");
}

export function nowKstUnix(): number {
  return Math.floor(Date.now() / 1000);
}

export function kstStartOfDayMs(date = new Date()): number {
  const ymd = toYmd(date);
  return new Date(`${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T00:00:00+09:00`).getTime();
}

export function chartTimeToUnix(time: unknown): number | null {
  if (typeof time === "number") return time;
  if (typeof time === "string") {
    return Math.floor(new Date(`${time}T00:00:00+09:00`).getTime() / 1000);
  }
  if (time && typeof time === "object" && "year" in time) {
    const t = time as { year: number; month: number; day: number };
    const y = t.year;
    const m = String(t.month).padStart(2, "0");
    const d = String(t.day).padStart(2, "0");
    return Math.floor(new Date(`${y}-${m}-${d}T00:00:00+09:00`).getTime() / 1000);
  }
  return null;
}

export function formatKstChartTime(time: unknown): string {
  const unix = chartTimeToUnix(time);
  if (unix == null) return "";
  return formatKstTime(unix, true);
}

export function formatKstChartTick(time: unknown): string {
  const unix = chartTimeToUnix(time);
  if (unix == null) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(unix * 1000));
}

export function formatDisplayTime(value?: string | null): string {
  if (!value) return "--:--:--";
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) return trimmed;
  return formatKstDateTime(trimmed);
}

export function normalizeSearch(text: string): string {
  return (text || "")
    .replace(/[‐‑‒–—―－]/g, "-")
    .replace(/[．。｡]/g, ".")
    .toLowerCase()
    .replace(/[\s()[\]{}_/,·]/g, "");
}

export function mergeBondMessages(prev: BondMessage[], incoming: BondMessage[], max = 5000): BondMessage[] {
  if (incoming.length === 0) return prev;
  const next = [...prev];
  incoming.forEach((msg) => {
    const idx = next.findIndex((m) => m.id === msg.id);
    if (idx >= 0) next[idx] = msg;
    else next.unshift(msg);
  });
  return next.slice(0, max);
}

export function matchesSearch(message: BondMessage, query: string): boolean {
  if (!query.trim()) return true;
  const q = normalizeSearch(query);
  const hay = normalizeSearch(
    [message.trade_name, message.message, message.match_value, message.trade_company ?? ""].join(" ")
  );
  return hay.includes(q);
}

export function formatRow(msg: BondMessage, includeSource: boolean) {
  const hasName = msg.trade_name.trim().length > 0 && !msg.trade_name.includes("**");
  const prefix = includeSource
    ? `${msg.trade_name} (${msg.trade_time})`
     : formatDisplayTime(msg.trade_time);
  const company = includeSource && msg.trade_company ? ` (${msg.trade_company})` : "";
  return { prefix, company, hasName };
}

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function dayLabel(bond: BondInfo): string {
  return (bond.dayOfWeekWithHoliday ?? bond.dayOfWeek ?? "").replace("요일", "");
}

function averageCredit(ratings: BondInfo["creditRatings"]): string | null {
  const nums: number[] = [];
  for (const val of Object.values(ratings)) {
    const s = val != null ? String(val).trim() : "";
    if (s && CREDIT_NUM[s] != null) nums.push(CREDIT_NUM[s]);
  }
  if (nums.length === 0) return null;
  const avg = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  return CREDIT_LABEL[avg] ?? null;
}

function formatCredit(bond: BondInfo, opts: QuoteOptions): string {
  if (!opts.includeCredit) return "";
  const avg = opts.creditAverageImpl ? averageCredit(bond.creditRatings) : null;
  if (avg) return ` [${avg}]`;
  if (opts.creditSlashFallback === false) return "";
  const slash = [bond.creditRatings.kis, bond.creditRatings.kbp, bond.creditRatings.nice, bond.creditRatings.fn]
    .filter(Boolean)
    .join("/");
  return slash ? ` [${slash}]` : "";
}

export function generateQuoteText(bond: BondInfo, action: "사자" | "팔자", opts: QuoteOptions = {}): string {
  const md = bond.maturityDate;
  const yy = md.substring(2, 4);
  const mm = opts.compactMaturityParts ? String(parseInt(md.substring(4, 6), 10)) : md.substring(4, 6);
  const dd = opts.compactMaturityParts ? String(parseInt(md.substring(6, 8), 10)) : md.substring(6, 8);
  const name = opts.nameMode === "bondName" ? bond.bondName : bond.issuer;
  const extras: string[] = [];
  if (opts.custom?.trim()) extras.push(opts.custom.trim());
  const bp = parseFloat(opts.bp ?? "");
  if (!Number.isNaN(bp)) extras.push(`${bp >= 0 ? "+" : ""}${bp}BP`);
  const won = parseFloat(opts.won ?? "");
  if (!Number.isNaN(won)) extras.push(`${won >= 0 ? "+" : ""}${won}원`);
  const ytm = parseFloat(opts.ytm ?? "");
  if (!Number.isNaN(ytm)) extras.push(`${ytm}%`);
  let text = `${yy}.${mm}.${dd}(${dayLabel(bond)}) ${name} (${bond.krCode})`;
  text += formatCredit(bond, opts);
  if (extras.length) text += ` ${extras.join(" ")}`;
  text += ` ${action}`;
  return text;
}

export function formatAmount(amount: number | string | undefined | null): string {
  if (amount == null || amount === "" || amount === "-") return "-";
  const n = typeof amount === "number" ? Math.floor(amount) : parseInt(String(amount), 10);
  if (Number.isNaN(n)) return "-";
  const eok = Math.floor(n / 1e8);
  const rest = n % 1e8;
  if (eok > 0) return rest > 0 ? `${eok.toLocaleString()}억${rest.toLocaleString()}원` : `${eok.toLocaleString()}억원`;
  return `${n.toLocaleString()}원`;
}

export function formatYmdDisplay(ymd: string): string {
  if (!ymd || ymd.length !== 8) return ymd;
  return `${ymd.substring(0, 4)}년 ${ymd.substring(4, 6)}월 ${ymd.substring(6, 8)}일`;
}

export function toYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KST_TIMEZONE }).format(date).replace(/-/g, "");
}

export function parseYmd(ymd: string): Date {
  const y = ymd.substring(0, 4);
  const m = ymd.substring(4, 6);
  const d = ymd.substring(6, 8);
  return new Date(`${y}-${m}-${d}T12:00:00+09:00`);
}

export function addBusinessDays(ymd: string, delta: number): string {
  const d = parseYmd(ymd);
  let remaining = Math.abs(delta);
  const step = delta > 0 ? 1 : -1;
  while (remaining > 0) {
    d.setDate(d.getDate() + step);
    const day = d.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return toYmd(d);
}

const HEATMAP_PALETTE: [number, number, number][] = [
  [255, 255, 204],
  [253, 217, 118],
  [253, 174, 97],
  [244, 109, 67],
  [215, 48, 39],
  [165, 0, 38],
];

export function heatmapColor(value: number, max: number, zeroColor = "rgb(30,30,30)"): string {
  if (value === 0) return zeroColor;
  if (max <= 0) return "rgb(245,247,250)";
  const ratio = Math.max(0, Math.min(1, value / max));
  const idx = HEATMAP_PALETTE.length - 1;
  const pos = ratio * idx;
  const lo = Math.floor(pos);
  const hi = Math.min(lo + 1, idx);
  const t = pos - lo;
  const a = HEATMAP_PALETTE[lo];
  const b = HEATMAP_PALETTE[hi];
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function actionLabel(action: DualBondRow["action"]): string {
  if (action === "buy") return "사자";
  if (action === "sell") return "팔자";
  return "-";
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}


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
export const todayIso = () => todayKstYmd();
