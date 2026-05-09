/**
 * Result Page Metadata Utilities
 *
 * Provides dynamic Open Graph metadata generation for the result page.
 * The OG image is served from /api/og endpoint in 1200x630 format.
 */

import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";

/**
 * Detect currency/market from ticker format
 */
function detectCurrency(ticker: string): "KRW" | "USD" {
  // Korean tickers end with .KS (KOSPI) or .KQ (KOSDAQ)
  if (ticker.endsWith(".KS") || ticker.endsWith(".KQ")) {
    return "KRW";
  }
  return "USD";
}

/**
 * Get exchange from ticker
 */
function getExchange(ticker: string): string {
  if (ticker.endsWith(".KS")) return "KSC";
  if (ticker.endsWith(".KQ")) return "KOE";
  return "NMS"; // Default to NASDAQ
}

/**
 * Build OG image URL for a stock result
 *
 * @param params - Parameters for OG image generation
 * @returns URL string for the OG image endpoint
 */
export function buildOgImageUrl(params: {
  ticker: string;
  buyDate: string;
  locale: Locale;
  percent?: number;
  tier?: string;
  theme?: "light" | "dark";
}): string {
  const {
    ticker,
    buyDate,
    locale,
    percent = 0,
    tier = "flat",
    theme = "light",
  } = params;

  const currency = detectCurrency(ticker);
  const exchange = getExchange(ticker);

  const searchParams = new URLSearchParams({
    ticker,
    buyDate,
    percent: percent.toString(),
    tier,
    locale,
    theme,
    size: "1200x630", // Standard OG image size
    currency,
    exchange,
  });

  return `/api/og?${searchParams.toString()}`;
}

/**
 * Generate dynamic metadata for a stock result page
 *
 * @param params - Metadata generation parameters
 * @returns Metadata object for Next.js
 */
export function generateResultMetadata(params: {
  ticker: string;
  buyDate: string;
  locale: Locale;
  appName: string;
  percent?: number;
  tier?: string;
}): Metadata {
  const { ticker, buyDate, locale, appName, percent, tier } = params;

  // Format ticker for display (remove exchange suffix)
  const displayTicker = ticker.replace(/\.(KS|KQ)$/, "");

  // Build dynamic title and description
  const title =
    locale === "ko"
      ? `${displayTicker} - 그때 샀으면... | ${appName}`
      : `${displayTicker} - What if I bought... | ${appName}`;

  const description =
    locale === "ko"
      ? `${buyDate}에 ${displayTicker}을(를) 샀다면 지금 얼마가 됐을까? 결과를 확인하세요!`
      : `What if you bought ${displayTicker} on ${buyDate}? Check your result!`;

  // Build OG image URL
  const ogImageUrl = buildOgImageUrl({
    ticker,
    buyDate,
    locale,
    percent,
    tier,
    theme: "light", // Light theme for better link preview visibility
  });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "ko" ? "ko_KR" : "en_US",
      siteName: appName,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt:
            locale === "ko"
              ? `${displayTicker} 주식 수익률 결과`
              : `${displayTicker} stock return result`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      languages: {
        ko: `/ko/result?ticker=${ticker}&date=${buyDate}`,
        en: `/en/result?ticker=${ticker}&date=${buyDate}`,
      },
    },
  };
}
