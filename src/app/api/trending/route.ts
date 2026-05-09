import { NextResponse, type NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import YahooFinance from "yahoo-finance2";
import type { StockSearchResult, ExchangeCode } from "@/types/stock";
import { getMarketFromExchange, getCurrencyForMarket } from "@/types/stock";
import {
  fetchForeignStockI18n,
  fetchKoreanCompanyName,
  getKoreanStockLogoUrl,
} from "@/lib/korean-stock-resolver";

const yahooFinance = new YahooFinance();
const CACHE_TTL_SECONDS = 600; // 10 min — trending changes faster than search

// Yahoo's trendingSymbols('KR') currently returns no data. Use a curated
// list of headline KOSPI/KOSDAQ tickers as a deterministic fallback.
const KR_FALLBACK = [
  "005930.KS", // Samsung Electronics
  "000660.KS", // SK Hynix
  "035420.KS", // NAVER
  "035720.KS", // Kakao
  "373220.KS", // LG Energy Solution
  "005380.KS", // Hyundai Motor
  "207940.KS", // Samsung Biologics
  "005490.KS", // POSCO Holdings
];

const fetchTrending = unstable_cache(
  async (region: "US" | "KR"): Promise<StockSearchResult[]> => {
    let symbols: string[] = [];
    try {
      const res = await yahooFinance.trendingSymbols(region, { count: 12 });
      symbols = (res.quotes ?? []).map((q) => q.symbol).filter(Boolean);
    } catch {
      symbols = [];
    }
    if (symbols.length === 0 && region === "KR") {
      symbols = KR_FALLBACK;
    }
    if (symbols.length === 0) return [];

    const quotes = await yahooFinance
      .quote(symbols, { return: "array" })
      .catch(() => [] as Array<Record<string, unknown>>);

    // Equity only, exclude indices/crypto/futures.
    const equities = (quotes as Array<{
      symbol?: string;
      quoteType?: string;
      exchange?: string;
      regularMarketPrice?: number;
      regularMarketPreviousClose?: number;
      longName?: string;
      shortName?: string;
    }>).filter(
      (q) =>
        q?.symbol &&
        q.quoteType === "EQUITY" &&
        (q.regularMarketPrice ?? q.regularMarketPreviousClose) != null
    );

    const enriched = await Promise.all(
      equities.slice(0, 5).map(async (q) => {
        const exchange = (q.exchange ?? "UNKNOWN") as ExchangeCode;
        const market = getMarketFromExchange(exchange);
        let logoUrl: string | undefined;
        let displayName: string | undefined;
        if (market === "KR") {
          logoUrl = getKoreanStockLogoUrl(q.symbol!);
          displayName = (await fetchKoreanCompanyName(q.symbol!)) ?? undefined;
        } else {
          const i18n = await fetchForeignStockI18n(q.symbol!, exchange).catch(
            () => ({}) as { logoUrl?: string; nameKo?: string }
          );
          logoUrl = i18n.logoUrl;
          displayName = i18n.nameKo;
        }
        return {
          symbol: q.symbol!,
          name: q.longName ?? q.shortName ?? q.symbol!,
          displayName: displayName ?? q.shortName ?? q.symbol!,
          exchange,
          market,
          quoteType: "EQUITY",
          logoUrl,
          currency: getCurrencyForMarket(market),
          currentPrice:
            q.regularMarketPrice ?? q.regularMarketPreviousClose,
        } satisfies StockSearchResult;
      })
    );

    return enriched;
  },
  ["trending-stocks-v1"],
  { revalidate: CACHE_TTL_SECONDS, tags: ["trending"] }
);

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region") === "KR" ? "KR" : "US";
  try {
    const results = await fetchTrending(region);
    return NextResponse.json(
      { success: true, results, count: results.length },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${CACHE_TTL_SECONDS * 6}`,
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
        results: [],
        count: 0,
      },
      { status: 502 }
    );
  }
}
