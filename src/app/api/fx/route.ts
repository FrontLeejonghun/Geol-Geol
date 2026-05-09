import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const CACHE_TTL_SECONDS = 3600;

/**
 * Fetch the current USD↔KRW rate from Yahoo (`KRW=X`).
 * Returned rate is "how many KRW per 1 USD".
 */
const fetchUsdKrw = unstable_cache(
  async (): Promise<number> => {
    const q = await yahooFinance.quote("KRW=X");
    const rate = q?.regularMarketPrice ?? q?.regularMarketPreviousClose;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      throw new Error("Invalid FX rate from Yahoo");
    }
    return rate;
  },
  ["fx-usd-krw"],
  { revalidate: CACHE_TTL_SECONDS, tags: ["fx"] }
);

export async function GET() {
  try {
    const usdToKrw = await fetchUsdKrw();
    return NextResponse.json(
      {
        success: true,
        // 1 USD = X KRW; reciprocal for KRW → USD
        usdToKrw,
        krwToUsd: 1 / usdToKrw,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${CACHE_TTL_SECONDS * 2}`,
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unknown FX error",
      },
      { status: 502 }
    );
  }
}
