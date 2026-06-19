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
export const WS_URL_KBOND = "wss://ws.forestbond.co.kr/ws/trade-another-kbond";
export const LAYOUT_STORAGE_KEY = "forestbond-clone-layout-v1";
export const INCLUDE_SOURCE_DEFAULT = true;

export const HEATMAP_CATEGORIES = [
  "특은채",
  "은행채",
  "공사채",
  "여전채",
  "회사채",
  "CD/CP",
  "FRN",
] as const;

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  section?: "Market" | "Data Analysis" | "Information";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", section: "Market" },
  { href: "/auto-quote", label: "Auto Quote", icon: "auto-quote", section: "Market" },
  { href: "/live-market", label: "Live Market", icon: "live", section: "Market" },
  { href: "/compass", label: "KTB/MSB Compass", icon: "compass", section: "Market" },
  { href: "/scope", label: "Bond Scope", icon: "scope", section: "Market" },
  { href: "/map", label: "Bond Map", icon: "map", section: "Market" },
  { href: "/order-book", label: "Order Book", icon: "book", section: "Market" },
  { href: "/bond-order", label: "Bond Issue", icon: "bond-order", section: "Market" },
  { href: "/bank-issue", label: "Bank Issue", icon: "building", section: "Market" },
  { href: "/public-issue", label: "Public Issue", icon: "landmark", section: "Market" },
  { href: "/bond-issue", label: "Bond Issue", icon: "file", section: "Market" },
  { href: "/heatmap", label: "Bond Heatmap", icon: "grid", section: "Data Analysis" },
  { href: "/introduction", label: "Introduction", icon: "info", section: "Information" },
  { href: "/guide/trade", label: "Trade Guide", icon: "book-open", section: "Information" },
];