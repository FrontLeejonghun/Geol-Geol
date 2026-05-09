// Korean nicknames for popular US stocks. The seed forbids static *KRX*
// mapping for KR stocks; this is a foreign-stock alias map, used only when
// the user types a Korean nickname for a non-Korean ticker (e.g. "테슬라").

const ALIASES: Array<{ ko: string; ticker: string }> = [
  { ko: "테슬라", ticker: "TSLA" },
  { ko: "애플", ticker: "AAPL" },
  { ko: "마이크로소프트", ticker: "MSFT" },
  { ko: "엔비디아", ticker: "NVDA" },
  { ko: "구글", ticker: "GOOGL" },
  { ko: "알파벳", ticker: "GOOGL" },
  { ko: "아마존", ticker: "AMZN" },
  { ko: "메타", ticker: "META" },
  { ko: "페이스북", ticker: "META" },
  { ko: "넷플릭스", ticker: "NFLX" },
  { ko: "디즈니", ticker: "DIS" },
  { ko: "코카콜라", ticker: "KO" },
  { ko: "스타벅스", ticker: "SBUX" },
  { ko: "맥도날드", ticker: "MCD" },
  { ko: "나이키", ticker: "NKE" },
  { ko: "보잉", ticker: "BA" },
  { ko: "비자", ticker: "V" },
  { ko: "마스터카드", ticker: "MA" },
  { ko: "페이팔", ticker: "PYPL" },
  { ko: "인텔", ticker: "INTC" },
  { ko: "퀄컴", ticker: "QCOM" },
  { ko: "오라클", ticker: "ORCL" },
  { ko: "시스코", ticker: "CSCO" },
  { ko: "어도비", ticker: "ADBE" },
  { ko: "세일즈포스", ticker: "CRM" },
  { ko: "락히드마틴", ticker: "LMT" },
  { ko: "화이자", ticker: "PFE" },
  { ko: "모더나", ticker: "MRNA" },
  { ko: "존슨앤존슨", ticker: "JNJ" },
  { ko: "버크셔", ticker: "BRK-B" },
  { ko: "제이피모간", ticker: "JPM" },
  { ko: "골드만삭스", ticker: "GS" },
  { ko: "월마트", ticker: "WMT" },
  { ko: "코스트코", ticker: "COST" },
  { ko: "쉘", ticker: "SHEL" },
  { ko: "엑손모빌", ticker: "XOM" },
  { ko: "팔란티어", ticker: "PLTR" },
  { ko: "유니티", ticker: "U" },
  { ko: "스노우플레이크", ticker: "SNOW" },
  { ko: "쇼피파이", ticker: "SHOP" },
  { ko: "우버", ticker: "UBER" },
  { ko: "에어비앤비", ticker: "ABNB" },
  { ko: "리비안", ticker: "RIVN" },
  { ko: "루시드", ticker: "LCID" },
];

export function findForeignTickersByKoreanQuery(query: string): string[] {
  const q = query.trim();
  if (!q) return [];
  const matches = ALIASES.filter((a) => a.ko.includes(q) || q.includes(a.ko));
  // de-dupe tickers, preserve order
  return Array.from(new Set(matches.map((m) => m.ticker)));
}
