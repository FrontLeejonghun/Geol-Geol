import "server-only";
import { unstable_cache } from "next/cache";
import YahooFinance from "yahoo-finance2";
import type { StockSearchResult, ExchangeCode } from "@/types/stock";
import { getMarketFromExchange } from "@/types/stock";
import { findForeignTickersByKoreanQuery } from "./foreign-stock-aliases";

const yahooFinance = new YahooFinance();

const KOREAN_RE = /[ㄱ-ㆎ가-힣]/;
const CACHE_TTL_SECONDS = 3600;

interface DaumQuote {
  symbolCode: string;
  name: string;
  isStock: boolean;
  isDelisted: boolean;
}

interface DaumSearchResponse {
  keyword: string;
  quotes: DaumQuote[];
}

export function isKoreanQuery(query: string): boolean {
  return KOREAN_RE.test(query);
}

async function fetchDaumQuotes(query: string): Promise<DaumQuote[]> {
  const url = `https://finance.daum.net/api/search/quotes?q=${encodeURIComponent(query)}&limit=10`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Referer: "https://finance.daum.net/",
    },
  });
  if (!res.ok) {
    throw new Error(`Daum search failed: ${res.status}`);
  }
  const data: DaumSearchResponse = await res.json();
  return (data.quotes ?? []).filter((q) => q.isStock && !q.isDelisted);
}

interface NaverBasic {
  stockName?: string;
  stockNameEng?: string;
  itemLogoUrl?: string;
  industryCodeType?: { industryGroupKor?: string };
}

async function fetchNaverBasic(suffixedTicker: string): Promise<NaverBasic | null> {
  const url = `https://api.stock.naver.com/stock/${suffixedTicker}/basic`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://m.stock.naver.com/",
    },
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as NaverBasic;
  } catch {
    return null;
  }
}

export interface ForeignStockI18n {
  nameKo?: string;
  industryKo?: string;
  logoUrl?: string;
}

/**
 * For US tickers, fetch Korean transliterated name and industry from Naver.
 * NASDAQ uses `${ticker}.O`; NYSE uses bare ticker. We try both.
 */
export const fetchForeignStockI18n = unstable_cache(
  async (ticker: string, exchange: string): Promise<ForeignStockI18n> => {
    const candidates =
      exchange === "NMS"
        ? [`${ticker}.O`, ticker]
        : exchange === "NYQ"
        ? [ticker, `${ticker}.O`]
        : [`${ticker}.O`, ticker];

    for (const candidate of candidates) {
      try {
        const data = await fetchNaverBasic(candidate);
        if (data?.stockName) {
          return {
            nameKo: data.stockName,
            industryKo: data.industryCodeType?.industryGroupKor,
            logoUrl: data.itemLogoUrl,
          };
        }
      } catch {
        // try next candidate
      }
    }
    return {};
  },
  ["naver-foreign-stock"],
  { revalidate: CACHE_TTL_SECONDS, tags: ["naver-foreign-stock"] }
);

export function getKoreanStockLogoUrl(ticker: string): string | undefined {
  const code = ticker.replace(/\.(KS|KQ)$/i, "");
  if (!/^\d{6}$/.test(code)) return undefined;
  return `https://ssl.pstatic.net/imgstock/fn/stage/logo/stock/Stock${code}.svg`;
}

export const fetchKoreanCompanyName = unstable_cache(
  async (ticker: string): Promise<string | null> => {
    const code = ticker.replace(/\.(KS|KQ)$/i, "");
    if (!/^\d{6}$/.test(code)) return null;
    try {
      const quotes = await fetchDaumQuotes(code);
      const exact = quotes.find(
        (q) => q.symbolCode.replace(/^A/, "") === code
      );
      return exact?.name ?? null;
    } catch {
      return null;
    }
  },
  ["korean-company-name"],
  { revalidate: CACHE_TTL_SECONDS, tags: ["korean-stock"] }
);

async function resolveForeignAliases(
  query: string
): Promise<StockSearchResult[]> {
  const tickers = findForeignTickersByKoreanQuery(query);
  if (tickers.length === 0) return [];

  const quotes = await yahooFinance.quote(tickers, { return: "array" });
  const i18nByTicker = await Promise.all(
    quotes
      .filter((q) => q?.symbol)
      .map(async (q) => {
        const exchange = (q.exchange ?? "UNKNOWN") as ExchangeCode;
        const i18n = await fetchForeignStockI18n(q.symbol, exchange).catch(
          () => ({} as ForeignStockI18n)
        );
        return { quote: q, i18n, exchange };
      })
  );

  return i18nByTicker
    .filter((entry) => entry.quote.regularMarketPrice != null)
    .map(({ quote, i18n, exchange }) => {
      const market = getMarketFromExchange(exchange);
      return {
        symbol: quote.symbol,
        name: quote.longName ?? quote.shortName ?? quote.symbol,
        displayName: i18n.nameKo ?? quote.shortName ?? quote.symbol,
        exchange,
        market,
        quoteType: "EQUITY",
        logoUrl: i18n.logoUrl,
        currency: market === "KR" ? "KRW" : "USD",
        currentPrice:
          quote.regularMarketPrice ?? quote.regularMarketPreviousClose,
      } satisfies StockSearchResult;
    });
}

async function resolveKoreanDomestic(
  query: string
): Promise<StockSearchResult[]> {
  const quotes = await fetchDaumQuotes(query);
  if (quotes.length === 0) return [];

  const candidates = quotes.flatMap((q) => {
    const code = q.symbolCode.replace(/^A/, "");
    return [
      { name: q.name, ticker: `${code}.KS`, code },
      { name: q.name, ticker: `${code}.KQ`, code },
    ];
  });

  const yahooResults = await yahooFinance.quote(
    candidates.map((c) => c.ticker),
    { return: "array" }
  );

  const validBySymbol = new Map<string, (typeof yahooResults)[number]>();
  for (const r of yahooResults) {
    if (r && r.symbol && r.regularMarketPrice != null) {
      validBySymbol.set(r.symbol, r);
    }
  }

  const seenBase = new Set<string>();
  const results: StockSearchResult[] = [];
  for (const cand of candidates) {
    const base = cand.code;
    if (!base || seenBase.has(base)) continue;
    const hit = validBySymbol.get(cand.ticker);
    if (!hit) continue;
    seenBase.add(base);

    const exchange = (hit.exchange ?? "UNKNOWN") as ExchangeCode;
    results.push({
      symbol: hit.symbol,
      name: hit.longName ?? hit.shortName ?? cand.name,
      displayName: cand.name,
      exchange,
      market: getMarketFromExchange(exchange),
      quoteType: "EQUITY",
      logoUrl: getKoreanStockLogoUrl(hit.symbol),
      currency: "KRW",
      currentPrice:
        hit.regularMarketPrice ?? hit.regularMarketPreviousClose,
    });
  }
  return results;
}

export const resolveKoreanQuery = unstable_cache(
  async (query: string): Promise<StockSearchResult[]> => {
    // Run foreign alias and KR domestic resolution in parallel.
    const [foreign, domestic] = await Promise.all([
      resolveForeignAliases(query).catch(() => []),
      resolveKoreanDomestic(query).catch(() => []),
    ]);

    // Foreign matches first because Korean nicknames like "테슬라" are
    // unambiguous — the user almost never wants the Korean themed-ETFs
    // when they typed a foreign company nickname.
    return [...foreign, ...domestic];
  },
  ["korean-stock-resolver-v2"],
  { revalidate: CACHE_TTL_SECONDS, tags: ["korean-stock"] }
);
