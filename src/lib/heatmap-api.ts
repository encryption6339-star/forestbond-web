const sectorCache = new Map<string, SectorRankingData>();
const govMonCache = new Map<string, GovMonData>();

let sectorBundlePromise: Promise<Record<string, SectorRankingData>> | null = null;
let govMonBundlePromise: Promise<Record<string, GovMonRaw>> | null = null;

function toApiDate(ymd: string): string {
  return ymd.replace(/\D/g, "");
}

function toIsoDate(ymd: string): string {
  const d = toApiDate(ymd);
  if (d.length !== 8) return ymd;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

function isoToApiDate(iso: string): string {
  return iso.replace(/-/g, "");
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

function hasSectorData(data: SectorRankingData | null | undefined): boolean {
  return (data?.sectors?.length ?? 0) > 0;
}

function hasGovMonData(data: GovMonData | null | undefined): boolean {
  return (data?.gov?.length ?? 0) > 0 || (data?.mon?.length ?? 0) > 0;
}

async function loadSectorBundle(): Promise<Record<string, SectorRankingData>> {
  if (!sectorBundlePromise) {
    sectorBundlePromise = fetch("/heatmapapi/data/sector-ranking.json", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return {};
        const json = (await res.json()) as { days?: Record<string, SectorRankingData> };
        return json.days ?? {};
      })
      .catch(() => ({}));
  }
  return sectorBundlePromise;
}

async function loadGovMonBundle(): Promise<Record<string, GovMonRaw>> {
  if (!govMonBundlePromise) {
    govMonBundlePromise = fetch("/heatmapapi/data/govmon.json", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return {};
        const json = (await res.json()) as { days?: Record<string, GovMonRaw> };
        return json.days ?? {};
      })
      .catch(() => ({}));
  }
  return govMonBundlePromise;
}

export async function fetchPrevValidDate(dateYmd: string): Promise<string> {
  const key = toApiDate(dateYmd);
  try {
    const res = await fetch(`/heatmapapi/prev-valid-date?date=${key}`, { cache: "no-store" });
    if (!res.ok) return "";
    const json = (await res.json()) as { prev?: string };
    return json.prev ? isoToApiDate(json.prev) : "";
  } catch {
    return "";
  }
}

function latestBundleIso(days: Record<string, unknown>, iso: string): string {
  const keys = Object.keys(days).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k) && k <= iso).sort();
  return keys.length ? keys[keys.length - 1] : "";
}

async function fetchSectorRankingForDate(key: string): Promise<SectorRankingData | null> {
  const iso = toIsoDate(key);

  try {
    const res = await fetch(`/heatmapapi/sector-ranking?date=${key}`, { cache: "no-store" });
    if (res.ok) {
      const live = (await res.json()) as SectorRankingData;
      if (hasSectorData(live)) return live;
    }
  } catch {
    /* try bundle */
  }

  const bundle = await loadSectorBundle();
  const fromBundle = bundle[iso];
  if (hasSectorData(fromBundle)) return fromBundle;

  return null;
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
  if (cached && hasSectorData(cached)) return cached;

  let data = await fetchSectorRankingForDate(key);

  if (!hasSectorData(data)) {
    const prev = await fetchPrevValidDate(key);
    if (prev) data = await fetchSectorRankingForDate(prev);
  }

  if (!hasSectorData(data)) {
    const bundle = await loadSectorBundle();
    const iso = toIsoDate(key);
    const fallbackIso = latestBundleIso(bundle, iso);
    if (fallbackIso) data = bundle[fallbackIso] ?? null;
  }

  const result: SectorRankingData = data ?? { asof: toIsoDate(key), sectors: [] };
  if (hasSectorData(result)) sectorCache.set(key, result);
  return result;
}

async function fetchGovMonForDate(key: string): Promise<GovMonData | null> {
  const iso = toIsoDate(key);

  const bundle = await loadGovMonBundle();
  if (bundle[iso]) {
    const fromBundle = normalizeGovMon(bundle[iso]);
    if (hasGovMonData(fromBundle)) return fromBundle;
  }

  try {
    const perDay = await fetch(`/heatmapapi/data/govmon/${iso}.json`, { cache: "no-store" });
    if (perDay.ok) {
      const raw = (await perDay.json()) as GovMonRaw;
      const data = normalizeGovMon(raw);
      if (hasGovMonData(data)) return data;
    }
  } catch {
    /* continue */
  }

  try {
    const live = await fetch(`/heatmapapi/govmon?date=${key}`, { cache: "no-store" });
    if (live.ok) {
      const raw = (await live.json()) as GovMonRaw;
      const data = normalizeGovMon(raw);
      if (hasGovMonData(data)) return data;
    }
  } catch {
    /* continue */
  }

  return null;
}

export async function fetchGovMon(dateYmd: string): Promise<GovMonData> {
  const key = toApiDate(dateYmd);
  const cached = govMonCache.get(key);
  if (cached && hasGovMonData(cached)) return cached;

  let data = await fetchGovMonForDate(key);

  if (!hasGovMonData(data)) {
    const prev = await fetchPrevValidDate(key);
    if (prev) data = await fetchGovMonForDate(prev);
  }

  if (!hasGovMonData(data)) {
    const bundle = await loadGovMonBundle();
    const iso = toIsoDate(key);
    const fallbackIso = latestBundleIso(bundle, iso);
    if (fallbackIso) data = normalizeGovMon(bundle[fallbackIso]);
  }

  const result: GovMonData = data ?? { asof: toIsoDate(key), gov: [], mon: [] };
  if (hasGovMonData(result)) govMonCache.set(key, result);
  return result;
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
