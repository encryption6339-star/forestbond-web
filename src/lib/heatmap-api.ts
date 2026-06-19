const sectorCache = new Map<string, SectorRankingData>();
const govMonCache = new Map<string, GovMonData>();

function toApiDate(ymd: string): string {
  return ymd.replace(/\D/g, "");
}

function toIsoDate(ymd: string): string {
  const d = toApiDate(ymd);
  if (d.length !== 8) return ymd;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

function normalizeGovMon(raw: GovMonRaw): GovMonData {
  const sortFn = (a: GovMonBondRow, b: GovMonBondRow) =>
    (b.total || 0) - (a.total || 0) || (b.buy || 0) - (a.buy || 0);

  return {
    asof: raw.asof,
    gov: Array.isArray(raw.gov) ? [...raw.gov].sort(sortFn).slice(0, 10) : [],
    mon: Array.isArray(raw.mon) ? [...raw.mon].sort(sortFn).slice(0, 10) : [],
  };
}

export function sectorRankingLimit(sectorName: string): number {
  return sectorName === "특은채" || sectorName === "은행채" ? 5 : 10;
}

export function trimSectorRanking(data: SectorRankingData): SectorRankingData {
  return {
    asof: data.asof,
    sectors: (data.sectors ?? []).map((sector) => ({
      ...sector,
      rankings: (sector.rankings ?? []).slice(0, sectorRankingLimit(sector.name)),
    })),
  };
}

export async function fetchSectorRanking(dateYmd: string): Promise<SectorRankingData> {
  const key = toApiDate(dateYmd);
  const cached = sectorCache.get(key);
  if (cached) return cached;

  const res = await fetch(`/heatmapapi/sector-ranking?date=${key}`, { cache: "no-store" });
  if (!res.ok) throw new Error("섹터 랭킹 데이터를 불러올 수 없습니다.");
  const data = (await res.json()) as SectorRankingData;
  sectorCache.set(key, data);
  return data;
}

export async function fetchGovMon(dateYmd: string): Promise<GovMonData> {
  const key = toApiDate(dateYmd);
  const cached = govMonCache.get(key);
  if (cached) return cached;

  const iso = toIsoDate(key);

  try {
    const perDay = await fetch(`/heatmapapi/data/govmon/${iso}.json`, { cache: "no-store" });
    if (perDay.ok) {
      const raw = (await perDay.json()) as GovMonRaw;
      const data = normalizeGovMon(raw);
      govMonCache.set(key, data);
      return data;
    }

    const bundle = await fetch("/heatmapapi/data/govmon.json", { cache: "no-store" });
    if (bundle.ok) {
      const json = (await bundle.json()) as { days?: Record<string, GovMonRaw> };
      const day = json.days?.[iso];
      if (day) {
        const data = normalizeGovMon(day);
        govMonCache.set(key, data);
        return data;
      }
    }

    const live = await fetch(`/heatmapapi/govmon?date=${key}`, { cache: "no-store" });
    if (live.ok) {
      const raw = (await live.json()) as GovMonRaw;
      const data = normalizeGovMon(raw);
      govMonCache.set(key, data);
      return data;
    }
  } catch {
    // fall through
  }

  const empty: GovMonData = { asof: iso, gov: [], mon: [] };
  govMonCache.set(key, empty);
  return empty;
}

export interface SectorRankingItem {
  name: string;
  volume: number;
}

export interface SectorRankingSector {
  name: string;
  rankings: SectorRankingItem[];
}

export interface SectorRankingData {
  asof?: string;
  sectors: SectorRankingSector[];
}

export interface GovMonBondRow {
  trade_code: string;
  buy: number;
  sell: number;
  total: number;
}

export interface GovMonData {
  asof?: string;
  gov: GovMonBondRow[];
  mon: GovMonBondRow[];
}

interface GovMonRaw {
  asof?: string;
  gov?: GovMonBondRow[];
  mon?: GovMonBondRow[];
}
