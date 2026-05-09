// Yahoo Finance uses GICS-aligned sector/industry strings in English.
// We translate the most common ones to Korean for the ko locale.
// Unknown values fall back to the English label.

const INDUSTRY_KO: Record<string, string> = {
  // sectors
  "Technology": "기술",
  "Consumer Cyclical": "소비재 (경기민감)",
  "Consumer Defensive": "소비재 (필수)",
  "Communication Services": "통신",
  "Financial Services": "금융",
  "Healthcare": "헬스케어",
  "Industrials": "산업재",
  "Energy": "에너지",
  "Basic Materials": "원자재",
  "Real Estate": "부동산",
  "Utilities": "유틸리티",

  // common industries
  "Consumer Electronics": "전자제품",
  "Auto Manufacturers": "자동차 제조",
  "Software—Application": "소프트웨어",
  "Software - Application": "소프트웨어",
  "Software - Infrastructure": "인프라 소프트웨어",
  "Semiconductors": "반도체",
  "Internet Content & Information": "인터넷 서비스",
  "Internet Retail": "온라인 리테일",
  "Banks - Diversified": "은행",
  "Banks—Diversified": "은행",
  "Pharmaceuticals": "제약",
  "Drug Manufacturers - General": "제약",
  "Biotechnology": "바이오",
  "Aerospace & Defense": "항공우주·방산",
  "Entertainment": "엔터테인먼트",
  "Telecom Services": "통신 서비스",
};

export function translateIndustry(en: string | undefined): string | undefined {
  if (!en) return undefined;
  return INDUSTRY_KO[en] ?? en;
}
