export const CATEGORIES = [
  "gov",
  "mon",
  "indust",
  "public",
  "bank",
  "perp",
  "comp",
  "FRN",
  "CD",
  "Info",
  "etc",
  "ad",
] as const;

export type CategoryId = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  gov: "Gov(included KTB)",
  mon: "MSB",
  indust: "Special Banks",
  public: "Public",
  bank: "Banks",
  perp: "Card/Capital",
  comp: "Corp",
  CD: "CD,CP,ABCP,ABTSB",
  FRN: "FRN",
  Info: "Info",
  etc: "etc",
  ad: "Advertisement",
};

export const DEFAULT_LAYOUT = [
  ...CATEGORIES.filter((c) => c !== "ad").map((id, t) => ({
    id,
    x: (t % 3) * 4,
    y: Math.floor(t / 3) * 4,
    w: 4,
    h: 4,
  })),
  { id: "ad", x: 8, y: 12, w: 4, h: 3 },
];

export const WS_MAP_URL = "wss://ws.forestbond.co.kr/ws/map";
export const WS_DUAL_URL = "wss://ws.forestbond.co.kr/ws/dual";
export const LAYOUT_STORAGE_KEY = "forestbond-clone-layout-v1";
export const INCLUDE_SOURCE_DEFAULT = true;

export const HEATMAP_CATEGORIES = [
  "특은채",
  "공사채",
  "은행채",
  "여전채",
  "회사채",
  "CD/CP",
  "FRN",
] as const;

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  section?: "Market" | "Guide";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/compass", label: "Compass", icon: "compass", section: "Market" },
  { href: "/map", label: "Map", icon: "map", section: "Market" },
  { href: "/order-book", label: "Order Book", icon: "book", section: "Market" },
  { href: "/bank-issue", label: "Bank Issue", icon: "building", section: "Market" },
  { href: "/public-issue", label: "Public Issue", icon: "landmark", section: "Market" },
  { href: "/bond-issue", label: "Bond Issue", icon: "file", section: "Market" },
  { href: "/heatmap", label: "Heatmap", icon: "grid", section: "Market" },
  { href: "/introduction", label: "Introduction", icon: "info", section: "Guide" },
  { href: "/guide/trade", label: "Trade Guide", icon: "book-open", section: "Guide" },
];
