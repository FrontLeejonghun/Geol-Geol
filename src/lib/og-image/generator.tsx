/**
 * OG Image Generator Component
 *
 * React component designed for @vercel/og (satori) rendering.
 * Generates shareable Open Graph images with Korean font support.
 */

import { ImageResponse } from "@vercel/og";
import { loadOgImageFonts, getOgFontFamily } from "./fonts";
import { getOgTheme, getOgOutcomeLabel, getOgBrandingText } from "./themes";
import type {
  ShareImageSize,
  Theme,
  Locale,
  Stock,
  PnL,
  MemeCopy,
} from "@/types/stock";
import { getShareImageDimensions } from "@/types/stock";

// =============================================================================
// Types
// =============================================================================

export interface OgImageInput {
  /** Stock information */
  stock: Stock;
  /** Buy date (resolved) */
  buyDate: string;
  /** P&L calculation result */
  pnl: PnL;
  /** Meme copy to display */
  memeCopy: MemeCopy;
  /** Theme for styling */
  theme: Theme;
  /** Locale for formatting */
  locale: Locale;
}

export interface GenerateOgImageOptions {
  /** Image size preset */
  size: ShareImageSize;
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

// =============================================================================
// OG Image Components
// =============================================================================

interface OgLayoutProps {
  input: OgImageInput;
  size: ShareImageSize;
}

/**
 * Portrait layout (1080x1350) - Instagram-style
 */
function PortraitLayout({ input }: OgLayoutProps): React.ReactElement {
  const { stock, buyDate, pnl, memeCopy, theme: themeMode, locale } = input;
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
      {/* Header */}
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
              fontSize: 28,
              fontWeight: 600,
              color: theme.primaryText,
            }}
          >
            {stock.ticker}
          </span>
          <span
            style={{
              marginLeft: 12,
              padding: "4px 12px",
              backgroundColor: theme.cardBg,
              borderRadius: 6,
              fontSize: 16,
              fontWeight: 500,
              color: theme.mutedText,
            }}
          >
            {stock.exchange}
          </span>
        </div>
        <span
          style={{
            fontSize: 18,
            color: theme.mutedText,
          }}
        >
          {dateLabel}: {buyDate}
        </span>
      </div>

      {/* Meme Copy */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        <span
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: theme.primaryText,
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          {memeCopy.headline}
        </span>
        <span
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: theme.secondaryText,
          }}
        >
          {memeCopy.subline}
        </span>
      </div>

      {/* Main Percentage */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: theme.percentText,
            lineHeight: 1,
          }}
        >
          {formatPercent(pnl.percent, locale)}
        </span>

        {/* Outcome Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 32,
            padding: "10px 24px",
            backgroundColor: theme.badgeBg,
            borderRadius: 24,
          }}
        >
          <span style={{ fontSize: 28, marginRight: 8 }}>{theme.icon}</span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: theme.badgeText,
            }}
          >
            {outcomeLabel}
          </span>
        </div>
      </div>

      {/* Branding Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 40,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: theme.primaryText,
          }}
        >
          {branding.title}
        </span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: theme.mutedText,
            marginLeft: 12,
          }}
        >
          {branding.tagline}
        </span>
      </div>
    </div>
  );
}

/**
 * Landscape layout (1200x630) - Open Graph / Twitter Card
 *
 * Optimized for link previews with:
 * - Large, legible percentage at thumbnail size
 * - Clear visual hierarchy with ticker prominently displayed
 * - Outcome badge with emoji for immediate emotional impact
 * - Meme copy headline for viral appeal
 * - Branding footer with app name
 */
function LandscapeLayout({ input }: OgLayoutProps): React.ReactElement {
  const { stock, buyDate, pnl, memeCopy, theme: themeMode, locale } = input;
  const theme = getOgTheme(pnl.outcomeTier, themeMode);
  const fontFamily = getOgFontFamily(locale);
  const branding = getOgBrandingText(locale);
  const outcomeLabel = getOgOutcomeLabel(pnl.outcomeTier, locale);

  // Format buy date for display - shorter format for OG
  const dateLabel = locale === "ko" ? "매수일" : "If bought on";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "40px 50px",
        background: theme.backgroundGradient,
        fontFamily,
        position: "relative",
      }}
    >
      {/* Top Bar: Ticker + Date */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Large Ticker Symbol */}
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: theme.primaryText,
              letterSpacing: "-0.5px",
            }}
          >
            {stock.ticker.replace(/\.(KS|KQ)$/, "")}
          </span>
          {/* Exchange Badge */}
          <span
            style={{
              marginLeft: 12,
              padding: "6px 12px",
              backgroundColor: theme.cardBg,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: theme.mutedText,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            {stock.exchange}
          </span>
        </div>
        {/* Date */}
        <span
          style={{
            fontSize: 16,
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
          flex: 1,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left Side: Meme Copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "55%",
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: theme.primaryText,
              lineHeight: 1.2,
              marginBottom: 12,
            }}
          >
            {memeCopy.headline}
          </span>
          <span
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: theme.secondaryText,
            }}
          >
            {memeCopy.subline}
          </span>
        </div>

        {/* Right Side: Big Percentage + Badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          {/* Large Percentage - Most important visual element */}
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: theme.percentText,
              lineHeight: 1,
              letterSpacing: "-2px",
            }}
          >
            {formatPercent(pnl.percent, locale)}
          </span>

          {/* Outcome Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 16,
              padding: "10px 20px",
              backgroundColor: theme.badgeBg,
              borderRadius: 24,
            }}
          >
            <span style={{ fontSize: 24, marginRight: 8 }}>{theme.icon}</span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: theme.badgeText,
              }}
            >
              {outcomeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Branding */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 24,
          paddingTop: 16,
          borderTop: `1px solid ${theme.borderColor}`,
        }}
      >
        {/* App Branding */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: theme.primaryText,
            }}
          >
            {branding.title}
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: theme.mutedText,
              marginLeft: 10,
            }}
          >
            {branding.tagline}
          </span>
        </div>

        {/* URL hint for users */}
        <span
          style={{
            fontSize: 14,
            color: theme.mutedText,
          }}
        >
          geolgeol.app
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Main Generator Function
// =============================================================================

/**
 * Generate OG image from input data
 *
 * @param input - OG image input data
 * @param options - Generation options
 * @returns ImageResponse for @vercel/og
 */
export async function generateOgImage(
  input: OgImageInput,
  options: GenerateOgImageOptions
): Promise<ImageResponse> {
  const { size } = options;
  const dimensions = getShareImageDimensions(size);

  // Load fonts
  const { fonts } = await loadOgImageFonts({ weights: [400, 600, 700] });

  // Select layout based on size
  const Layout = size === "1200x630" ? LandscapeLayout : PortraitLayout;

  return new ImageResponse(<Layout input={input} size={size} />, {
    width: dimensions.width,
    height: dimensions.height,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight,
      style: f.style,
    })),
  });
}

/**
 * Generate OG image for Open Graph meta tags (landscape format)
 *
 * Convenience function for the most common use case.
 */
export async function generateOpenGraphImage(
  input: OgImageInput
): Promise<ImageResponse> {
  return generateOgImage(input, { size: "1200x630" });
}

/**
 * Generate OG image for social sharing (portrait format)
 *
 * Optimized for Instagram and similar platforms.
 */
export async function generateSocialShareImage(
  input: OgImageInput
): Promise<ImageResponse> {
  return generateOgImage(input, { size: "1080x1350" });
}
