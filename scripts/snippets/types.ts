import type { CategoryId } from "./config";

export interface BondMessage {
  id: number;
  source: string;
  category: CategoryId | string;
  match_value: string;
  trade_name: string;
  trade_time: string;
  message: string;
  trade_company: string | null;
  created_at: string;
}

export interface GridLayoutItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DualBondRow {
  fullname: string;
  expire_date: string;
  bondCD: string;
  privateEval: number | string | null;
  action: "buy" | "sell" | null;
  tradeTime: string | null;
  additionInfo: string | null;
  hour_time?: string | null;
  latestInterestRate?: string | null;
  nickName?: string;
}

export interface CreditRatings {
  kis?: string;
  kbp?: string;
  nice?: string;
  fn?: string;
}

export interface BondAdditionalInfo {
  issueAmount?: number | string;
  bondType?: string;
  currency?: string;
  industry?: string;
}

export interface BondInfo {
  krCode: string;
  bondName: string;
  issuer: string;
  maturityDate: string;
  dayOfWeek?: string;
  dayOfWeekWithHoliday?: string;
  creditRatings: CreditRatings;
  additionalInfo?: BondAdditionalInfo;
}

export interface IssuerSearchResponse {
  success: boolean;
  message?: string;
  bonds: BondInfo[];
}

export interface HeatmapData {
  asof?: string;
  categories: string[];
  buckets: string[];
  matrix: number[][];
  bucketTotals?: number[];
}

export interface QuoteOptions {
  nameMode?: "issuer" | "bondName";
  compactMaturityParts?: boolean;
  includeCredit?: boolean;
  creditAverageImpl?: boolean;
  creditSlashFallback?: boolean;
  custom?: string;
  bp?: string;
  won?: string;
  ytm?: string;
}

export type ConnectionStatus = {
  connected: boolean;
  mock: boolean;
};
