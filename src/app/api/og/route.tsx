/**
 * OG Image API Route
 *
 * Generates dynamic Open Graph images (1200x630) optimized for social sharing
 * and link previews. Also supports portrait format (1080x1350) for Instagram.
 *
 * The 1200x630 format is the recommended size for:
 * - Open Graph (Facebook, LinkedIn, Discord)
 * - Twitter Card (summary_large_image)
 * - iMessage/WhatsApp link previews
 *
 * @example
 * GET /api/og?ticker=AAPL&buyDate=2020-01-15&percent=150&tier=jackpot&locale=ko&theme=light&size=1200x630
 */

import { NextRequest, NextResponse } from "next/server";
import { generateOgImage, type OgImageInput } from "@/lib/og-image";
import type {
  ShareImageSize,
  OutcomeTier,
  Theme,
  Locale,
  Stock,
  PnL,
  MemeCopy,
} from "@/types/stock";
import { selectMemeCopy } from "@/lib/meme-copy";

// =============================================================================
// Config
// =============================================================================

export const runtime = "edge";

// OG images don't need frequent updates - cache aggressively
// Using dynamic = 'force-static' is not appropriate here since params vary
// Instead, we'll add cache headers to the response

// =============================================================================
// Types
// =============================================================================

interface OgQueryParams {
  ticker: string;
  exchange: string;
  buyDate: string;
  percent: number;
  tier: OutcomeTier;
  locale: Locale;
  theme: Theme;
  size: ShareImageSize;
  currency: "KRW" | "USD";
  headline?: string;
  subline?: string;
}

// =============================================================================
// Validation
// =============================================================================

const VALID_TIERS: OutcomeTier[] = [
  "catastrophe",
  "loss",
  "flat",
  "gain",
  "jackpot",
];
const VALID_LOCALES: Locale[] = ["ko", "en"];
const VALID_THEMES: Theme[] = ["light", "dark"];
const VALID_SIZES: ShareImageSize[] = ["1080x1350", "1200x630"];
const VALID_CURRENCIES = ["KRW", "USD"] as const;

function parseQueryParams(
  searchParams: URLSearchParams
): OgQueryParams | { error: string } {
  // Required parameters
  const ticker = searchParams.get("ticker");
  const buyDate = searchParams.get("buyDate");
  const percentStr = searchParams.get("percent");
  const tier = searchParams.get("tier") as OutcomeTier;

  if (!ticker) {
    return { error: "Missing required parameter: ticker" };
  }
  if (!buyDate) {
    return { error: "Missing required parameter: buyDate" };
  }
  if (!percentStr) {
    return { error: "Missing required parameter: percent" };
  }
  if (!tier) {
    return { error: "Missing required parameter: tier" };
  }

  const percent = parseFloat(percentStr);
  if (isNaN(percent)) {
    return { error: "Invalid percent value" };
  }

  if (!VALID_TIERS.includes(tier)) {
    return { error: `Invalid tier. Must be one of: ${VALID_TIERS.join(", ")}` };
  }

  // Optional parameters with defaults
  const locale = (searchParams.get("locale") as Locale) || "ko";
  if (!VALID_LOCALES.includes(locale)) {
    return {
      error: `Invalid locale. Must be one of: ${VALID_LOCALES.join(", ")}`,
    };
  }

  const theme = (searchParams.get("theme") as Theme) || "light";
  if (!VALID_THEMES.includes(theme)) {
    return {
      error: `Invalid theme. Must be one of: ${VALID_THEMES.join(", ")}`,
    };
  }

  const size = (searchParams.get("size") as ShareImageSize) || "1200x630";
  if (!VALID_SIZES.includes(size)) {
    return { error: `Invalid size. Must be one of: ${VALID_SIZES.join(", ")}` };
  }

  const currency =
    (searchParams.get("currency") as "KRW" | "USD") || "USD";
  if (!VALID_CURRENCIES.includes(currency)) {
    return {
      error: `Invalid currency. Must be one of: ${VALID_CURRENCIES.join(", ")}`,
    };
  }

  const exchange = searchParams.get("exchange") || (currency === "KRW" ? "KSC" : "NMS");

  // Optional meme copy override
  const headline = searchParams.get("headline") || undefined;
  const subline = searchParams.get("subline") || undefined;

  return {
    ticker,
    exchange,
    buyDate,
    percent,
    tier,
    locale,
    theme,
    size,
    currency,
    headline,
    subline,
  };
}

// =============================================================================
// Route Handler
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseQueryParams(searchParams);

    if ("error" in parsed) {
      return new Response(JSON.stringify({ error: parsed.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const {
      ticker,
      exchange,
      buyDate,
      percent,
      tier,
      locale,
      theme,
      size,
      currency,
      headline,
      subline,
    } = parsed;

    // Build stock object
    const stock: Stock = {
      ticker,
      name: ticker, // We only have ticker in URL params
      exchange,
      market: currency === "KRW" ? "KR" : "US",
      currency,
      marketHours:
        currency === "KRW"
          ? { timezone: "Asia/Seoul", openTime: "09:00", closeTime: "15:30" }
          : {
              timezone: "America/New_York",
              openTime: "09:30",
              closeTime: "16:00",
            },
    };

    // Build PnL object
    const pnl: PnL = {
      absolute: null, // We don't have virtual amount in URL params
      percent,
      currency,
      outcomeTier: tier,
    };

    // Get meme copy (use override if provided, otherwise select randomly)
    const memeCopy: MemeCopy =
      headline && subline
        ? { headline, subline }
        : selectMemeCopy(locale, tier);

    // Build input
    const input: OgImageInput = {
      stock,
      buyDate,
      pnl,
      memeCopy,
      theme,
      locale,
    };

    // Generate image
    const imageResponse = await generateOgImage(input, { size });

    // Clone the response and add proper caching headers for CDN/browser
    // OG images are deterministic based on input params, so we can cache aggressively
    const headers = new Headers(imageResponse.headers);

    // Cache for 1 hour at browser level, 1 day at CDN level
    // Using s-maxage for CDN caching, max-age for browser
    headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200"
    );

    // Add content disposition for direct downloads
    headers.set(
      "Content-Disposition",
      `inline; filename="geolgeol-${ticker}-${buyDate}.png"`
    );

    return new NextResponse(imageResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("OG Image generation error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate OG image",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
