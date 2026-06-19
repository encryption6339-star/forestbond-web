export type IssuerCategory = {
  id: string;
  label: string;
  issuers: string[];
};

export const ISSUER_CATEGORIES: IssuerCategory[] = [
  {
    id: "card",
    label: "카드",
    issuers: ["삼성카드", "신한카드", "현대카드", "롯데카드", "KB국민카드", "우리카드", "하나카드", "BC카드"],
  },
  {
    id: "bank",
    label: "은행",
    issuers: ["KB국민은행", "신한은행", "하나은행", "우리은행", "NH농협은행", "SC제일은행", "한국씨티은행", "IBK기업은행"],
  },
  {
    id: "power",
    label: "전력",
    issuers: ["한국전력공사", "한전KPS", "한전KDN", "한국남동발전", "한국중부발전", "한국서부발전", "한국남부발전", "한국동서발전"],
  },
  {
    id: "special-bank",
    label: "특수은행",
    issuers: ["산업은행", "수출입은행", "중소기업은행", "농협금융중앙회", "수협은행"],
  },
  {
    id: "public",
    label: "공사",
    issuers: ["한국가스공사", "한국토지주택공사", "한국도로공사", "한국수자원공사", "예금보험공사", "한국철도공사"],
  },
  {
    id: "corp",
    label: "회사",
    issuers: ["삼성전자", "SK하이닉스", "현대자동차", "기아", "포스코", "LG에너지솔루션", "LG화학", "SK이노베이션"],
  },
];

export type QuickPhrase = { label: string; text: string };

export const GOV_QUICK_PHRASES: QuickPhrase[] = [
  { label: "민평 팔자", text: "민평 팔자" },
  { label: "팔자", text: "팔자" },
  { label: "사자", text: "사자" },
  { label: "민평 사자", text: "민평 사자" },
  { label: "매도잇나요", text: "억 매도잇나요" },
  { label: "+0.5원 사자", text: "-0.5원 사자" },
  { label: "20억 팔자", text: "20억 팔자" },
  { label: "50억 사자", text: "50억 사자" },
];

export const MON_QUICK_PHRASES: QuickPhrase[] = [
  { label: "팔자", text: "팔자" },
  { label: "사자", text: "사자" },
  { label: "100억 사자", text: "100억 사자" },
  { label: "민평 사자", text: "민평 사자" },
  { label: "20억 팔자", text: "20억 팔자" },
  { label: "50억 사자", text: "50억 사자" },
];

export const KTB_BONDS = [
  { code: "KR103501GE32", name: "국고 25-3 (3Y)", tenor: "3Y" },
  { code: "KR103502GE54", name: "국고 25-5 (5Y)", tenor: "5Y" },
  { code: "KR103503GE76", name: "국고 25-7 (7Y)", tenor: "7Y" },
  { code: "KR103504GE98", name: "국고 25-9 (10Y)", tenor: "10Y" },
];

export const MSB_BONDS = [
  { code: "KR350101G726", name: "통안 26-091 (91D)", tenor: "91D" },
  { code: "KR350301G730", name: "통안 27-1 (1Y)", tenor: "1Y" },
  { code: "KR350401G732", name: "통안 28-2 (2Y)", tenor: "2Y" },
];