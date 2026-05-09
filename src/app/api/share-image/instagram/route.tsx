/**
 * Instagram Share Image API Route
 *
 * Generates Instagram-optimized 4:5 (1080x1350) share images for stock results.
 * Designed for viral sharing with visually striking layouts and Korean font support.
 *
 * @example
 * GET /api/share-image/instagram?ticker=AAPL&buyDate=2020-01-15&percent=150&tier=jackpot&locale=ko&theme=light
 *
 * Supports:
 * - GET: Query parameters for simple use
 * - POST: JSON body for full data including custom meme copy
 */

import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { loadOgImageFonts, getOgFontFamily } from "@/lib/og-image/fonts";
import { getOgTheme, getOgOutcomeLabel, getOgBrandingText } from "@/lib/og-image/themes";
import { selectMemeCopy } from "@/lib/meme-copy";
import type {
  OutcomeTier,
  Theme,
  Locale,
  Stock,
  PnL,
  MemeCopy,
  PriceHistory,
} from "@/types/stock";

// =============================================================================
// Config
// =============================================================================

export const runtime = "edge";

// Cache Instagram share images for 1 hour at CDN level
export const revalidate = 3600;

// Image dimensions for Instagram 4:5
const WIDTH = 1080;
const HEIGHT = 1350;

// =============================================================================
// Types
// =============================================================================

interface InstagramImageInput {
  /** Stock information */
  stock: Stock;
  /** Buy date (resolved) - ISO format */
  buyDate: string;
  /** Past price on buy date */
  pastPrice?: number;
  /** Current price */
  currentPrice?: number;
  /** P&L calculation result */
  pnl: PnL;
  /** Meme copy to display */
  memeCopy: MemeCopy;
  /** Price history for sparkline (optional) */
  priceHistory?: PriceHistory;
  /** Theme for styling */
  theme: Theme;
  /** Locale for formatting */
  locale: Locale;
}

interface QueryParams {
  ticker: string;
  exchange: string;
  buyDate: string;
  percent: number;
  tier: OutcomeTier;
  pastPrice?: number;
  currentPrice?: number;
  locale: Locale;
  theme: Theme;
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
const VALID_CURRENCIES = ["KRW", "USD"] as const;

function parseQueryParams(
  searchParams: URLSearchParams
): QueryParams | { error: string } {
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

  const currency =
    (searchParams.get("currency") as "KRW" | "USD") || "USD";
  if (!VALID_CURRENCIES.includes(currency)) {
    return {
      error: `Invalid currency. Must be one of: ${VALID_CURRENCIES.join(", ")}`,
    };
  }

  const exchange = searchParams.get("exchange") || (currency === "KRW" ? "KSC" : "NMS");

  // Optional price data
  const pastPriceStr = searchParams.get("pastPrice");
  const currentPriceStr = searchParams.get("currentPrice");
  const pastPrice = pastPriceStr ? parseFloat(pastPriceStr) : undefined;
  const currentPrice = currentPriceStr ? parseFloat(currentPriceStr) : undefined;

  // Optional meme copy override
  const headline = searchParams.get("headline") || undefined;
  const subline = searchParams.get("subline") || undefined;

  return {
    ticker,
    exchange,
    buyDate,
    percent,
    tier,
    pastPrice,
    currentPrice,
    locale,
    theme,
    currency,
    headline,
    subline,
  };
}

// =============================================================================
// Formatting Utilities
// =============================================================================

function formatPercent(value: number, locale: Locale): string {
  const sign = value >= 0 ? "+" : "";
  const formatted = new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return `${sign}${value < 0 ? "-" : ""}${formatted}%`;
}

function formatCurrency(
  value: number,
  currency: "KRW" | "USD",
  locale: Locale
): string {
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "KRW" ? 0 : 2,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(value);
}

// =============================================================================
// Instagram Layout Component
// =============================================================================

interface InstagramLayoutProps {
  input: InstagramImageInput;
}

/**
 * Instagram 4:5 Portrait Layout (1080x1350)
 *
 * Optimized for Instagram sharing with:
 * - Large, bold typography for readability
 * - Prominent percentage display
 * - Meme-style copy for viral appeal
 * - Price info and branding
 */
function InstagramLayout({ input }: InstagramLayoutProps): React.ReactElement {
  const {
    stock,
    buyDate,
    pastPrice,
    currentPrice,
    pnl,
    memeCopy,
    theme: themeMode,
    locale,
  } = input;

  const theme = getOgTheme(pnl.outcomeTier, themeMode);
  const fontFamily = getOgFontFamily(locale);
  const branding = getOgBrandingText(locale);
  const outcomeLabel = getOgOutcomeLabel(pnl.outcomeTier, locale);
  const dateLabel = locale === "ko" ? "매수일" : "Buy Date";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 60,
        background: theme.backgroundGradient,
        fontFamily,
      }}
    >
      {/* Header: Ticker & Date */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: theme.primaryText,
              letterSpacing: "-0.02em",
            }}
          >
            {stock.ticker}
          </span>
          <span
            style={{
              marginLeft: 12,
              padding: "6px 14px",
              backgroundColor: theme.cardBg,
              borderRadius: 8,
              fontSize: 18,
              fontWeight: 600,
              color: theme.mutedText,
            }}
          >
            {stock.exchange}
          </span>
        </div>
        <span
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: theme.mutedText,
          }}
        >
          {dateLabel}: {buyDate}
        </span>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Meme Copy - Headline */}
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: theme.primaryText,
            lineHeight: 1.2,
            textAlign: "center",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          {memeCopy.headline}
        </span>

        {/* Meme Copy - Subline */}
        <span
          style={{
            fontSize: 30,
            fontWeight: 500,
            color: theme.secondaryText,
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          {memeCopy.subline}
        </span>

        {/* Main Percentage Display */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 120,
              fontWeight: 700,
              color: theme.percentText,
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {formatPercent(pnl.percent, locale)}
          </span>
        </div>

        {/* Outcome Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 32px",
            backgroundColor: theme.badgeBg,
            borderRadius: 32,
            marginBottom: 48,
          }}
        >
          <span style={{ fontSize: 32, marginRight: 12 }}>{theme.icon}</span>
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: theme.badgeText,
            }}
          >
            {outcomeLabel}
          </span>
        </div>

        {/* Price Card - Only show if prices are provided */}
        {pastPrice !== undefined && currentPrice !== undefined && (
          <div
            style={{
              display: "flex",
              width: "100%",
              maxWidth: 800,
              backgroundColor: theme.cardBg,
              borderRadius: 20,
              padding: 32,
              border: `2px solid ${theme.borderColor}`,
            }}
          >
            {/* Past Price */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: theme.mutedText,
                  marginBottom: 8,
                }}
              >
                {locale === "ko" ? "매수가" : "Past Price"}
              </span>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: theme.primaryText,
                }}
              >
                {formatCurrency(pastPrice, pnl.currency, locale)}
              </span>
            </div>

            {/* Arrow */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 24px",
              }}
            >
              <span style={{ fontSize: 32, color: theme.mutedText }}>→</span>
            </div>

            {/* Current Price */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: theme.mutedText,
                  marginBottom: 8,
                }}
              >
                {locale === "ko" ? "현재가" : "Current Price"}
              </span>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: theme.percentText,
                }}
              >
                {formatCurrency(currentPrice, pnl.currency, locale)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Branding Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 32,
          borderTop: `2px solid ${theme.borderColor}`,
        }}
      >
        <span
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: theme.primaryText,
          }}
        >
          {branding.title}
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: theme.mutedText,
            marginLeft: 16,
          }}
        >
          {branding.tagline}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * GET /api/share-image/instagram
 *
 * Generate Instagram share image via query parameters.
 *
 * Query Parameters:
 * - ticker: Stock symbol (required)
 * - buyDate: Past purchase date (required, YYYY-MM-DD)
 * - percent: Percentage change (required)
 * - tier: Outcome tier (required)
 * - pastPrice: Past price (optional)
 * - currentPrice: Current price (optional)
 * - locale: ko/en (default: ko)
 * - theme: light/dark (default: light)
 * - currency: KRW/USD (default: USD)
 * - exchange: Exchange code (default: based on currency)
 * - headline: Custom headline (optional)
 * - subline: Custom subline (optional)
 */
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
      pastPrice,
      currentPrice,
      locale,
      theme,
      currency,
      headline,
      subline,
    } = parsed;

    // Build stock object
    const stock: Stock = {
      ticker,
      name: ticker,
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
      absolute: null,
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
    const input: InstagramImageInput = {
      stock,
      buyDate,
      pastPrice,
      currentPrice,
      pnl,
      memeCopy,
      theme,
      locale,
    };

    // Generate image
    return await generateInstagramImage(input);
  } catch (error) {
    console.error("Instagram share image generation error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate Instagram share image",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * POST /api/share-image/instagram
 *
 * Generate Instagram share image with full JSON body.
 * Accepts complete InstagramImageInput structure.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.stock?.ticker) {
      return new Response(
        JSON.stringify({ error: "Missing required field: stock.ticker" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!body.buyDate) {
      return new Response(
        JSON.stringify({ error: "Missing required field: buyDate" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!body.pnl) {
      return new Response(
        JSON.stringify({ error: "Missing required field: pnl" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build input with defaults
    const input: InstagramImageInput = {
      stock: {
        ticker: body.stock.ticker,
        name: body.stock.name || body.stock.ticker,
        exchange: body.stock.exchange || "NMS",
        market: body.stock.market || "US",
        currency: body.stock.currency || "USD",
        marketHours: body.stock.marketHours || {
          timezone: "America/New_York",
          openTime: "09:30",
          closeTime: "16:00",
        },
      },
      buyDate: body.buyDate,
      pastPrice: body.pastPrice,
      currentPrice: body.currentPrice,
      pnl: {
        absolute: body.pnl.absolute ?? null,
        percent: body.pnl.percent,
        currency: body.pnl.currency || "USD",
        outcomeTier: body.pnl.outcomeTier || "flat",
      },
      memeCopy: body.memeCopy || selectMemeCopy(
        body.locale || "ko",
        body.pnl.outcomeTier || "flat"
      ),
      priceHistory: body.priceHistory,
      theme: body.theme || "light",
      locale: body.locale || "ko",
    };

    // Generate image
    return await generateInstagramImage(input);
  } catch (error) {
    console.error("Instagram share image generation error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate Instagram share image",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// =============================================================================
// Image Generation
// =============================================================================

/**
 * Generate Instagram share image
 */
async function generateInstagramImage(
  input: InstagramImageInput
): Promise<ImageResponse> {
  // Load fonts
  const { fonts } = await loadOgImageFonts({ weights: [400, 600, 700] });

  return new ImageResponse(<InstagramLayout input={input} />, {
    width: WIDTH,
    height: HEIGHT,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight,
      style: f.style,
    })),
  });
}
