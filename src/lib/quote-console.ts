import type { BondMessage, DualBondRow } from "@/lib/types";

export type QuoteSide = "O" | "B";

export type ParsedQuote = {
  id: string;
  name: string;
  bucket: string;
  side: QuoteSide;
  size: string;
  yieldText: string;
  yieldNum: number | null;
  dealer: string;
  anchorKey: string;
  spreadBp: number;
  quotedY: number | null;
  liveY: number | null;
  prevY: number | null;
  category: string;
  tradeTime: string;
};

export type CeMetric = {
  key: string;
  label: string;
  value: string;
  delta: string;
  tone: "up" | "dn" | "flat";
  kind: "px" | "y";
};

const BUCKET_BY_CATEGORY: Record<string, string> = {
  gov: "3Y",
  mon: "2Y",
  bank: "5Y",
  indust: "특은",
  public: "공사",
  comp: "회사",
  FRN: "FRN",
  CD: "CD/CP",
};

function toNum(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseYield(text: string): number | null {
  const pct = text.match(/(\d+\.\d+)\s*%/);
  if (pct) return Number(pct[1]);
  const bp = text.match(/민\s*([+-]?\d+(?:\.\d+)?)/);
  if (bp) return null;
  const plain = text.match(/\b(\d+\.\d{2,3})\b/);
  if (plain) return Number(plain[1]);
  return null;
}

function parseSize(text: string): string {
  const m = text.match(/(\d+)\s*억/);
  return m ? `${m[1]}억` : "-";
}

function sideFromMessage(text: string): QuoteSide | null {
  if (/팔자|매도/.test(text)) return "O";
  if (/사자|매수/.test(text)) return "B";
  return null;
}

function quoteName(msg: BondMessage): string {
  const mv = msg.match_value?.trim();
  if (mv && msg.message.includes(mv)) return msg.message.split(/\s+/).slice(0, 3).join(" ").slice(0, 48);
  return msg.message.slice(0, 48) || msg.trade_name || "호가";
}

export function parseQuoteMessage(msg: BondMessage): ParsedQuote | null {
  const side = sideFromMessage(msg.message);
  if (!side) return null;
  const bucket = BUCKET_BY_CATEGORY[String(msg.category)] ?? "기타";
  const yieldNum = parseYield(msg.message);
  return {
    id: String(msg.id),
    name: quoteName(msg),
    bucket,
    side,
    size: parseSize(msg.message),
    yieldText: yieldNum != null ? `${yieldNum.toFixed(3)}%` : "-",
    yieldNum,
    dealer: (msg.trade_company ?? msg.trade_name ?? "-").replace(/\*\*/g, "").trim() || "-",
    anchorKey: msg.match_value || msg.category,
    spreadBp: 0,
    quotedY: yieldNum,
    liveY: yieldNum,
    prevY: yieldNum,
    category: String(msg.category),
    tradeTime: msg.trade_time || "",
  };
}

export function buildQuotesFromMessages(messages: BondMessage[], limit = 120): ParsedQuote[] {
  const out: ParsedQuote[] = [];
  for (const msg of messages) {
    const q = parseQuoteMessage(msg);
    if (q) out.push(q);
    if (out.length >= limit) break;
  }
  return out;
}

function fmtDelta(curr: number, prev: number, kind: "px" | "y"): { text: string; tone: "up" | "dn" | "flat" } {
  const diff = curr - prev;
  if (Math.abs(diff) < (kind === "y" ? 0.0005 : 0.005)) return { text: kind === "y" ? "0.0bp" : "0.00", tone: "flat" };
  const tone = diff > 0 ? "up" : "dn";
  if (kind === "y") {
    const bp = diff * 100;
    return { text: `${bp >= 0 ? "+" : ""}${bp.toFixed(1)}bp`, tone };
  }
  return { text: `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`, tone };
}

export function buildCeMetrics(
  govRows: DualBondRow[],
  monRows: DualBondRow[],
  prev?: Map<string, number>
): CeMetric[] {
  const rows: CeMetric[] = [];
  const push = (key: string, label: string, value: number | null, kind: "px" | "y") => {
    if (value == null) return;
    const p = prev?.get(key) ?? value;
    const d = fmtDelta(value, p, kind);
    rows.push({
      key,
      label,
      value: kind === "y" ? `${value.toFixed(3)}%` : value.toFixed(2),
      delta: d.text,
      tone: d.tone,
      kind,
    });
    prev?.set(key, value);
  };

  const gov3 = govRows.find((r) => r.bondCD?.includes("25-4") || r.bondCD?.includes("25-3")) ?? govRows[0];
  const gov10 = govRows.find((r) => r.bondCD?.includes("24-3") || r.bondCD?.includes("25-9")) ?? govRows[1];

  if (gov3) push("KTB3", "국채 3년(Compass)", toNum(gov3.privateEval), "y");
  if (gov10) push("KTB10", "국채 10년(Compass)", toNum(gov10.privateEval), "y");

  govRows.slice(0, 4).forEach((r, i) => {
    push(`gov-${r.bondCD || i}`, r.fullname || r.bondCD || "국고", toNum(r.privateEval), "y");
  });
  monRows.slice(0, 3).forEach((r, i) => {
    push(`mon-${r.bondCD || i}`, r.fullname || r.bondCD || "통안", toNum(r.privateEval), "y");
  });

  return rows.slice(0, 8);
}

export function bucketOrder(): string[] {
  return ["1Y", "2Y", "3Y", "5Y", "10Y", "20Y", "특은", "공사", "은행", "회사", "FRN", "CD/CP", "기타"];
}

export function groupQuotes(quotes: ParsedQuote[]): Map<string, ParsedQuote[]> {
  const map = new Map<string, ParsedQuote[]>();
  for (const q of quotes) {
    const list = map.get(q.bucket) ?? [];
    list.push(q);
    map.set(q.bucket, list);
  }
  return map;
}

export function countCrosses(quotes: ParsedQuote[]): number {
  let total = 0;
  const byBucket = groupQuotes(quotes);
  byBucket.forEach((items) => {
    const offers = items.filter((q) => q.side === "O" && q.yieldNum != null);
    const bids = items.filter((q) => q.side === "B" && q.yieldNum != null);
    offers.forEach((o) => {
      bids.forEach((b) => {
        if (o.anchorKey && o.anchorKey === b.anchorKey && b.yieldNum! >= o.yieldNum!) total += 1;
      });
    });
  });
  return total;
}
