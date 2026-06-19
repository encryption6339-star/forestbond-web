import type { BondMessage, DualBondRow } from "@/lib/types";

export type QuoteSide = "O" | "B";

export type ParsedQuote = {
  id: string;
  name: string;
  bucket: string;
  side: QuoteSide;
  size: string;
  sizeNum: number;
  yieldText: string;
  yieldNum: number | null;
  dealer: string;
  benchKey: string;
  spreadBp: number;
  quotedY: number | null;
  liveY: number | null;
  prevY: number | null;
  livePx: number | null;
  coupon: number | null;
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

export type MarketEntry = {
  key: string;
  label: string;
  v: number;
  prev: number;
  kind: "px" | "y";
};

export type QuoteMode = "auto" | "manual";

export const BENCH_KEY_FOR: Record<string, string> = {
  "1Y": "BM_2Y",
  "2Y": "BM_2Y",
  "3Y": "BM_3Y",
  "5Y": "BM_5Y",
  "10Y": "BM_10Y",
  "20Y": "BM_20Y",
  "특은": "BM_5Y",
  "공사": "BM_5Y",
  "은행": "BM_5Y",
  "회사": "BM_5Y",
  "FRN": "BM_3Y",
  "CD/CP": "BM_2Y",
  "기타": "BM_3Y",
};

export const BUCKET_YEARS: Record<string, number> = {
  "1Y": 1,
  "2Y": 2,
  "3Y": 3,
  "5Y": 5,
  "10Y": 10,
  "20Y": 20,
  "특은": 5,
  "공사": 5,
  "은행": 5,
  "회사": 5,
  "FRN": 3,
  "CD/CP": 1,
  "기타": 3,
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

export function priceFromYield(yrs: number, coupon: number, ytm: number, freq = 2): number {
  const y = ytm / 100 / freq;
  const c = (coupon / 100) * 100 / freq;
  const n = yrs * freq;
  const nf = Math.floor(n);
  const fr = n - nf;
  if (y === 0) return c * n + 100;
  let pv = 0;
  for (let i = 1; i <= nf; i += 1) {
    const t = fr > 0 ? i - (1 - fr) : i;
    pv += c / Math.pow(1 + y, t);
  }
  let tl = fr > 0 ? nf - (1 - fr) : nf;
  if (nf === 0) {
    tl = fr;
    pv += c / Math.pow(1 + y, tl);
  }
  return pv + 100 / Math.pow(1 + y, tl);
}

function parseYield(text: string): number | null {
  const pct = text.match(/(\d+\.\d+)\s*%/);
  if (pct) return Number(pct[1]);
  if (/민\s*[+-]?\d/.test(text)) return null;
  const plain = text.match(/\b(\d+\.\d{2,3})\b/);
  if (plain) return Number(plain[1]);
  return null;
}

function parseSize(text: string): { label: string; num: number } {
  const m = text.match(/(\d+)\s*억/);
  return m ? { label: `${m[1]}억`, num: Number(m[1]) } : { label: "-", num: 0 };
}

function sideFromMessage(text: string): QuoteSide | null {
  if (/팔자|매도/.test(text)) return "O";
  if (/사자|매수/.test(text)) return "B";
  return null;
}

function bucketFromMessage(msg: BondMessage): string {
  const text = `${msg.message} ${msg.match_value}`;
  if (/20년|20Y|4503|20-/i.test(text)) return "20Y";
  if (/10년|10Y|3509|24-3|25-9/i.test(text)) return "10Y";
  if (/5년|5Y/i.test(text)) return "5Y";
  if (/3년|3Y|25-3|25-4|25-5/i.test(text)) return "3Y";
  if (/2년|2Y|통/i.test(text)) return "2Y";
  if (/1년|1Y/i.test(text)) return "1Y";
  return BUCKET_BY_CATEGORY[String(msg.category)] ?? "3Y";
}

function quoteName(msg: BondMessage): string {
  const mv = msg.match_value?.trim();
  if (mv && msg.message.includes(mv)) {
    return msg.message.split(/\s+/).slice(0, 4).join(" ").slice(0, 52);
  }
  return msg.message.slice(0, 52) || msg.trade_name || "호가";
}

function fmtDelta(curr: number, prev: number, kind: "px" | "y"): { text: string; tone: "up" | "dn" | "flat" } {
  const diff = curr - prev;
  if (Math.abs(diff) < (kind === "y" ? 0.0005 : 0.005)) {
    return { text: kind === "y" ? "0.0bp" : "0.00", tone: "flat" };
  }
  const tone = diff > 0 ? "up" : "dn";
  if (kind === "y") {
    const bp = diff * 100;
    return { text: `${bp >= 0 ? "+" : ""}${bp.toFixed(1)}bp`, tone };
  }
  return { text: `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`, tone };
}

function pickGov(govRows: DualBondRow[], patterns: string[]): DualBondRow | undefined {
  for (const p of patterns) {
    const hit = govRows.find((r) => r.bondCD?.includes(p) || r.fullname?.includes(p));
    if (hit) return hit;
  }
  return undefined;
}

export function buildMarketState(
  govRows: DualBondRow[],
  monRows: DualBondRow[],
  prev?: Record<string, MarketEntry>
): Record<string, MarketEntry> {
  const gov2 = pickGov(govRows, ["24-1", "23-"]) ?? govRows[0];
  const gov3 = pickGov(govRows, ["25-4", "25-3"]) ?? govRows[1];
  const gov5 = pickGov(govRows, ["25-5", "24-5"]) ?? govRows[2];
  const gov10 = pickGov(govRows, ["24-3", "25-9", "25-6"]) ?? govRows[3];
  const gov20 = pickGov(govRows, ["25-9", "24-9"]) ?? govRows[4];
  const mon2 = monRows[0];

  const y2 = toNum(gov2?.privateEval) ?? toNum(mon2?.privateEval) ?? 3.3;
  const y3 = toNum(gov3?.privateEval) ?? 4.13;
  const y5 = toNum(gov5?.privateEval) ?? 4.05;
  const y10 = toNum(gov10?.privateEval) ?? 3.625;
  const y20 = toNum(gov20?.privateEval) ?? 4.25;

  const px3Base = prev?.KTB3?.v ?? 102.96;
  const px10Base = prev?.KTB10?.v ?? 106.6;
  const px3Delta = (y3 - (prev?.BM_3Y?.v ?? y3)) * 8;
  const px10Delta = (y10 - (prev?.BM_10Y?.v ?? y10)) * 12;

  const next: Record<string, MarketEntry> = {
    KTB3: { key: "KTB3", label: "국채선물 3년", v: +(px3Base + px3Delta).toFixed(2), prev: prev?.KTB3?.v ?? px3Base, kind: "px" },
    KTB10: { key: "KTB10", label: "국채선물 10년", v: +(px10Base + px10Delta).toFixed(2), prev: prev?.KTB10?.v ?? px10Base, kind: "px" },
    BM_2Y: { key: "BM_2Y", label: "국고 2년", v: y2, prev: prev?.BM_2Y?.v ?? y2, kind: "y" },
    BM_3Y: { key: "BM_3Y", label: "국고 3년", v: y3, prev: prev?.BM_3Y?.v ?? y3, kind: "y" },
    BM_5Y: { key: "BM_5Y", label: "국고 5년", v: y5, prev: prev?.BM_5Y?.v ?? y5, kind: "y" },
    BM_10Y: { key: "BM_10Y", label: "국고 10년", v: y10, prev: prev?.BM_10Y?.v ?? y10, kind: "y" },
    BM_20Y: { key: "BM_20Y", label: "국고 20년", v: y20, prev: prev?.BM_20Y?.v ?? y20, kind: "y" },
  };

  return next;
}

export function marketToCeMetrics(market: Record<string, MarketEntry>): CeMetric[] {
  return Object.values(market).map((m) => {
    const d = fmtDelta(m.v, m.prev, m.kind);
    return {
      key: m.key,
      label: m.label,
      value: m.kind === "y" ? `${m.v.toFixed(3)}%` : m.v.toFixed(2),
      delta: d.text,
      tone: d.tone,
      kind: m.kind,
    };
  });
}

export type QuoteAnchor = {
  spreadBp: number;
  benchKey: string;
  quotedY: number;
  frozenY: number;
};

export function parseQuoteMessage(msg: BondMessage): Omit<ParsedQuote, "benchKey" | "spreadBp" | "quotedY" | "liveY" | "prevY" | "livePx" | "coupon"> | null {
  const side = sideFromMessage(msg.message);
  if (!side) return null;
  const bucket = bucketFromMessage(msg);
  const yieldNum = parseYield(msg.message);
  const size = parseSize(msg.message);
  return {
    id: String(msg.id),
    name: quoteName(msg),
    bucket,
    side,
    size: size.label,
    sizeNum: size.num,
    yieldText: yieldNum != null ? `${yieldNum.toFixed(3)}%` : "-",
    yieldNum,
    dealer: (msg.trade_company ?? msg.trade_name ?? "-").replace(/\*\*/g, "").trim() || "-",
    category: String(msg.category),
    tradeTime: msg.trade_time || "",
  };
}

export function buildQuotesFromMessages(
  messages: BondMessage[],
  market: Record<string, MarketEntry>,
  mode: QuoteMode,
  anchors: Map<string, QuoteAnchor>,
  limit = 160
): ParsedQuote[] {
  const out: ParsedQuote[] = [];
  for (const msg of messages) {
    const base = parseQuoteMessage(msg);
    if (!base || base.yieldNum == null) continue;

    const benchKey = BENCH_KEY_FOR[base.bucket] ?? "BM_3Y";
    const bench = market[benchKey]?.v ?? base.yieldNum;
    let anchor = anchors.get(base.id);
    if (!anchor) {
      anchor = {
        spreadBp: +((base.yieldNum - bench) * 100).toFixed(1),
        benchKey,
        quotedY: base.yieldNum,
        frozenY: base.yieldNum,
      };
      anchors.set(base.id, anchor);
    }

    const yrs = BUCKET_YEARS[base.bucket] ?? 3;
    const coupon = anchor.quotedY;
    let liveY = anchor.frozenY;
    if (mode === "auto") {
      liveY = +((market[anchor.benchKey]?.v ?? bench) + anchor.spreadBp / 100).toFixed(4);
      anchor.frozenY = liveY;
    }

    const prevY = anchor.quotedY;
    const livePx = priceFromYield(yrs, coupon, liveY);

    out.push({
      ...base,
      benchKey: anchor.benchKey,
      spreadBp: anchor.spreadBp,
      quotedY: anchor.quotedY,
      liveY,
      prevY,
      livePx: +livePx.toFixed(2),
      coupon,
    });
    if (out.length >= limit) break;
  }
  return out;
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

export function findCrossIds(quotes: ParsedQuote[]): Set<string> {
  const crossIds = new Set<string>();
  const byBucket = groupQuotes(quotes);
  byBucket.forEach((items) => {
    const offers = items.filter((q) => q.side === "O" && q.liveY != null).sort((a, b) => (a.liveY ?? 0) - (b.liveY ?? 0));
    const bids = items.filter((q) => q.side === "B" && q.liveY != null).sort((a, b) => (b.liveY ?? 0) - (a.liveY ?? 0));
    offers.forEach((o) => {
      bids.forEach((b) => {
        if (o.name === b.name && o.dealer !== b.dealer && (b.liveY ?? 0) - (o.liveY ?? 0) >= 0) {
          crossIds.add(o.id);
          crossIds.add(b.id);
        }
      });
    });
  });
  return crossIds;
}

export function countCrosses(quotes: ParsedQuote[]): number {
  const ids = findCrossIds(quotes);
  return ids.size / 2;
}

export function yieldDeltaText(liveY: number | null, quotedY: number | null): string {
  if (liveY == null || quotedY == null) return "";
  const dY = liveY - quotedY;
  if (Math.abs(dY) < 0.0005) return "";
  return `${dY > 0 ? "▲" : "▼"}${Math.abs(dY * 100).toFixed(1)}bp`;
}

export function yieldDeltaTone(liveY: number | null, quotedY: number | null): "up" | "dn" | "flat" {
  if (liveY == null || quotedY == null) return "flat";
  const dY = liveY - quotedY;
  if (dY > 0.0005) return "up";
  if (dY < -0.0005) return "dn";
  return "flat";
}

export function benchAnchorLabel(benchKey: string, spreadBp: number): string {
  const label = benchKey.replace("BM_", "국고 ");
  return `${label} ${spreadBp >= 0 ? "+" : ""}${spreadBp.toFixed(1)}bp`;
}
