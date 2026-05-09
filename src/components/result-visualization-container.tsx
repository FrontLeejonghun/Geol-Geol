"use client";

/**
 * Result Visualization Container Component
 *
 * A cohesive shareable card layout that composes the price chart and P&L summary
 * into a visually striking result card optimized for social sharing.
 *
 * Features:
 * - Prominent meme copy display (headline/subline)
 * - Integrated price chart with buy marker
 * - P&L summary metrics
 * - Outcome-tier specific visual styling
 * - Dark/light theme support
 * - Mobile-first responsive design
 * - Reference layout for share image canvas rendering
 */

import { forwardRef, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type {
  Stock,
  PriceHistory,
  PnL,
  MemeCopy,
  Locale,
  Theme,
  OutcomeTier,
} from "@/types/stock";
import { formatPercent, formatCurrency } from "@/lib/format";
import { PnLSummaryPanel } from "./pnl-summary-panel";
import { ComparablesPanel } from "./comparables-panel";

// =============================================================================
// Dynamic Imports - Performance Optimization
// =============================================================================

/**
 * Chart loading skeleton for suspense fallback
 */
function ChartLoadingSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-xl bg-gray-200"
      style={{ height: `${height}px` }}
      role="status"
      aria-label="Loading chart..."
    >
      <span className="sr-only">Loading chart...</span>
    </div>
  );
}

/**
 * Dynamically imported PriceHistoryChart
 * The lightweight-charts library (~130KB) is only loaded when this component renders
 */
const PriceHistoryChart = dynamic(
  () => import("./price-history-chart").then((mod) => mod.PriceHistoryChart),
  {
    loading: () => <ChartLoadingSkeleton />,
    ssr: false, // lightweight-charts requires browser APIs (canvas, DOM)
  }
);

// =============================================================================
// Types
// =============================================================================

export interface ResultVisualizationContainerProps {
  /** Stock information */
  stock: Stock;
  /** Resolved buy date (ISO format YYYY-MM-DD) */
  buyDate: string;
  /** Adjusted close price on buy date */
  pastPrice: number;
  /** Current/latest close price */
  currentPrice: number;
  /** P&L calculation result */
  pnl: PnL;
  /** Meme copy for display */
  memeCopy: MemeCopy;
  /** Price history for chart rendering */
  priceHistory: PriceHistory;
  /** Display locale */
  locale?: Locale;
  /** Theme for styling */
  theme?: Theme;
  /** Layout variant for different use cases */
  variant?: "card" | "share-portrait" | "share-landscape";
  /** Show the brand watermark */
  showBranding?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Render custom action buttons (share, download, etc.) */
  actions?: ReactNode;
  /** Whether this container is for screenshot/canvas capture */
  forCapture?: boolean;
}

// =============================================================================
// Theme & Styling Configuration
// =============================================================================

interface OutcomeTheme {
  /** Gradient background for card */
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  /** Accent border color */
  borderColor: string;
  /** Text colors */
  headlineColor: string;
  sublineColor: string;
  percentColor: string;
  /** Badge styling */
  badgeBg: string;
  badgeText: string;
  /** Emoji icon */
  icon: string;
  /** Glow effect color (for emphasis) */
  glowColor: string;
}

// Neutral shadcn-style palette: same surfaces for every outcome tier.
// Direction (gain vs loss) is conveyed *only* through the % color.
const NEUTRAL_LIGHT = {
  gradientFrom: "from-card",
  gradientVia: "via-card",
  gradientTo: "to-card",
  borderColor: "border-border",
  headlineColor: "text-foreground",
  sublineColor: "text-muted-foreground",
  badgeBg: "bg-muted",
  badgeText: "text-muted-foreground",
  glowColor: "",
} as const;

const POSITIVE = "text-emerald-600";
const NEGATIVE = "text-red-600";
const NEUTRAL_TEXT = "text-foreground";

const OUTCOME_THEMES: Record<Theme, Record<OutcomeTier, OutcomeTheme>> = {
  light: {
    catastrophe: {
      ...NEUTRAL_LIGHT,
      percentColor: NEGATIVE,
      icon: "💀",
    },
    loss: {
      ...NEUTRAL_LIGHT,
      percentColor: NEGATIVE,
      icon: "📉",
    },
    flat: {
      ...NEUTRAL_LIGHT,
      percentColor: NEUTRAL_TEXT,
      icon: "😐",
    },
    gain: {
      ...NEUTRAL_LIGHT,
      percentColor: POSITIVE,
      icon: "📈",
    },
    jackpot: {
      ...NEUTRAL_LIGHT,
      percentColor: POSITIVE,
      icon: "🚀",
    },
  },
  // Dark mode is disabled at the Tailwind level — we mirror the light
  // palette here so any leftover code paths that index into `dark` still
  // resolve to the same neutral surfaces.
  dark: {
    catastrophe: { ...NEUTRAL_LIGHT, percentColor: NEGATIVE, icon: "💀" },
    loss: { ...NEUTRAL_LIGHT, percentColor: NEGATIVE, icon: "📉" },
    flat: { ...NEUTRAL_LIGHT, percentColor: NEUTRAL_TEXT, icon: "😐" },
    gain: { ...NEUTRAL_LIGHT, percentColor: POSITIVE, icon: "📈" },
    jackpot: { ...NEUTRAL_LIGHT, percentColor: POSITIVE, icon: "🚀" },
  },
};

// Outcome tier labels
const OUTCOME_LABELS: Record<Locale, Record<OutcomeTier, string>> = {
  ko: {
    catastrophe: "대참사",
    loss: "손실",
    flat: "보합",
    gain: "수익",
    jackpot: "대박",
  },
  en: {
    catastrophe: "Disaster",
    loss: "Loss",
    flat: "Flat",
    gain: "Gain",
    jackpot: "Jackpot",
  },
};

// =============================================================================
// Helper Components
// =============================================================================

interface MemeCopyDisplayProps {
  memeCopy: MemeCopy;
  outcomeTheme: OutcomeTheme;
  variant: "card" | "share-portrait" | "share-landscape";
}

function MemeCopyDisplay({
  memeCopy,
  outcomeTheme,
  variant,
}: MemeCopyDisplayProps) {
  const isShareVariant = variant.startsWith("share-");
  const isLandscape = variant === "share-landscape";

  return (
    <div
      className={`
        text-center
        ${isLandscape ? "py-3" : isShareVariant ? "py-6" : "py-5"}
      `}
    >
      {/* Headline */}
      <h2
        className={`
          font-bold tracking-tight leading-tight
          ${outcomeTheme.headlineColor}
          ${
            isLandscape
              ? "text-2xl sm:text-3xl"
              : isShareVariant
                ? "text-3xl sm:text-4xl"
                : "text-2xl sm:text-3xl"
          }
        `}
      >
        {memeCopy.headline}
      </h2>

      {/* Subline */}
      <p
        className={`
          font-medium mt-1
          ${outcomeTheme.sublineColor}
          ${isLandscape ? "text-sm sm:text-base" : "text-base sm:text-lg"}
        `}
      >
        {memeCopy.subline}
      </p>
    </div>
  );
}

interface StockHeaderProps {
  stock: Stock;
  buyDate: string;
  currentPrice: number;
  outcomeTheme: OutcomeTheme;
  locale: Locale;
}

function StockHeader({
  stock,
  buyDate,
  currentPrice,
  outcomeTheme,
  locale,
}: StockHeaderProps) {
  const dateLabel = locale === "ko" ? "매수일" : "Buy Date";
  const priceLabel = locale === "ko" ? "현재가" : "Now";
  const headerName =
    locale === "ko" && stock.nameKo
      ? stock.nameKo
      : stock.nameEn ?? stock.ticker;
  const industryLabel =
    locale === "ko" ? stock.industryKo ?? stock.industry : stock.industry;
  const formattedCurrent = formatCurrency(currentPrice, stock.currency, locale);

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 border-b ${outcomeTheme.borderColor} bg-white/50`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {stock.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stock.logoUrl}
            alt=""
            width={36}
            height={36}
            loading="lazy"
            className="w-9 h-9 rounded-md bg-white object-contain p-0.5 ring-1 ring-gray-200 shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-base text-gray-900 truncate">
            {headerName}
          </span>
          {industryLabel && (
            <span className="text-xs text-gray-500 truncate">
              {industryLabel}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0 text-right">
        <span className="text-sm font-semibold text-gray-900 tabular-nums">
          {formattedCurrent}
        </span>
        <span className="text-[11px] text-gray-500">
          {priceLabel} · {dateLabel} {buyDate}
        </span>
      </div>
    </div>
  );
}

interface PercentBadgeProps {
  pnl: PnL;
  outcomeTheme: OutcomeTheme;
  outcomeLabel: string;
  locale: Locale;
  variant: "card" | "share-portrait" | "share-landscape";
}

function PercentBadge({
  pnl,
  outcomeTheme,
  outcomeLabel,
  locale,
  variant,
}: PercentBadgeProps) {
  const isShareVariant = variant.startsWith("share-");
  const isLandscape = variant === "share-landscape";
  const formattedPercent = formatPercent(pnl.percent, locale);

  return (
    <div
      className={`
        flex items-center justify-center gap-3 py-4
        ${isLandscape ? "flex-row" : "flex-col sm:flex-row"}
      `}
    >
      {/* Large percentage display */}
      <div
        className={`
          font-bold tracking-tight
          ${outcomeTheme.percentColor}
          ${
            isLandscape
              ? "text-4xl sm:text-5xl"
              : isShareVariant
                ? "text-5xl sm:text-6xl"
                : "text-4xl sm:text-5xl"
          }
        `}
        role="status"
        aria-label={`${locale === "ko" ? "수익률" : "Return"}: ${formattedPercent}`}
      >
        {formattedPercent}
      </div>

      {/* Outcome badge */}
      <div
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full
          ${outcomeTheme.badgeBg}
        `}
      >
        <span className="text-lg" aria-hidden="true">
          {outcomeTheme.icon}
        </span>
        <span
          className={`
            font-semibold text-sm
            ${outcomeTheme.badgeText}
          `}
        >
          {outcomeLabel}
        </span>
      </div>
    </div>
  );
}

interface BrandingFooterProps {
  theme: Theme;
  locale: Locale;
}

function BrandingFooter({ theme, locale }: BrandingFooterProps) {
  return (
    <div
      className={`
        flex items-center justify-center py-3 gap-2
        border-t
        ${theme === "dark" ? "border-slate-700/50 bg-slate-800/30" : "border-gray-200/50 bg-gray-50/50"}
      `}
    >
      <span
        className={`
          text-lg font-bold
          ${theme === "dark" ? "text-slate-300" : "text-gray-700"}
        `}
      >
        껄껄
      </span>
      <span
        className={`
          text-xs
          ${theme === "dark" ? "text-slate-400" : "text-gray-500"}
        `}
      >
        {locale === "ko" ? "그때 살껄..." : "Should've bought..."}
      </span>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export const ResultVisualizationContainer = forwardRef<
  HTMLDivElement,
  ResultVisualizationContainerProps
>(function ResultVisualizationContainer(
  {
    stock,
    buyDate,
    pastPrice,
    currentPrice,
    pnl,
    memeCopy,
    priceHistory,
    locale = "ko",
    theme = "light",
    variant = "card",
    showBranding = true,
    className = "",
    actions,
    forCapture = false,
  },
  ref
) {
  const outcomeTheme = OUTCOME_THEMES[theme][pnl.outcomeTier];
  const outcomeLabel = OUTCOME_LABELS[locale][pnl.outcomeTier];

  const isShareVariant = variant.startsWith("share-");
  const isLandscape = variant === "share-landscape";

  // Determine chart height based on variant
  const chartHeight = isLandscape ? 200 : isShareVariant ? 280 : 240;

  // Container base classes — neutral shadcn surface
  const containerClasses = `
    overflow-hidden rounded-xl
    bg-card text-card-foreground
    border ${outcomeTheme.borderColor}
    shadow-sm
    ${forCapture ? "" : "transition-all duration-200"}
    ${className}
  `;

  // Landscape layout (OG image style)
  if (isLandscape) {
    return (
      <div
        ref={ref}
        className={containerClasses}
        role="article"
        aria-label={locale === "ko" ? "주식 손익 결과" : "Stock P&L Result"}
      >
        <div className="flex h-full">
          {/* Left side: Meme copy + percentage */}
          <div className="flex-1 flex flex-col justify-center px-6">
            <MemeCopyDisplay
              memeCopy={memeCopy}
              outcomeTheme={outcomeTheme}
              variant={variant}
            />
            <PercentBadge
              pnl={pnl}
              outcomeTheme={outcomeTheme}
              outcomeLabel={outcomeLabel}
              locale={locale}
              variant={variant}
            />
            {/* Stock info */}
            <div
              className={`
                text-center text-sm
                ${theme === "dark" ? "text-slate-400" : "text-gray-600"}
              `}
            >
              {locale === "ko" && stock.nameKo
                ? stock.nameKo
                : stock.nameEn ?? stock.ticker}
              {" · "}
              {formatCurrency(currentPrice, stock.currency, locale)}
              {" · "}
              {buyDate}
            </div>
          </div>

          {/* Right side: Chart */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4">
              <PriceHistoryChart
                priceHistory={priceHistory}
                buyDate={buyDate}
                pastPrice={pastPrice}
                currentPrice={currentPrice}
                theme={theme}
                height={chartHeight}
                showCrosshair={!forCapture}
                className="h-full"
              />
            </div>
            {showBranding && <BrandingFooter theme={theme} locale={locale} />}
          </div>
        </div>

        {/* Actions (if any) */}
        {actions && !forCapture && (
          <div className="px-4 pb-4">{actions}</div>
        )}
      </div>
    );
  }

  // Portrait / Card layout (default)
  return (
    <div
      ref={ref}
      className={containerClasses}
      role="article"
      aria-label={locale === "ko" ? "주식 손익 결과" : "Stock P&L Result"}
    >
      {/* Stock header */}
      <StockHeader
        stock={stock}
        buyDate={buyDate}
        currentPrice={currentPrice}
        outcomeTheme={outcomeTheme}
        locale={locale}
      />

      {/* Meme copy section */}
      <MemeCopyDisplay
        memeCopy={memeCopy}
        outcomeTheme={outcomeTheme}
        variant={variant}
      />

      {/* Large percentage badge */}
      <PercentBadge
        pnl={pnl}
        outcomeTheme={outcomeTheme}
        outcomeLabel={outcomeLabel}
        locale={locale}
        variant={variant}
      />

      {/* Price chart — wrapper reserves height to prevent CLS */}
      <div
        className={`px-4 ${isShareVariant ? "pb-4" : "pb-3"}`}
        style={{ minHeight: chartHeight + 8 }}
      >
        <PriceHistoryChart
          priceHistory={priceHistory}
          buyDate={buyDate}
          pastPrice={pastPrice}
          currentPrice={currentPrice}
          theme={theme}
          height={chartHeight}
          showCrosshair={!forCapture}
          className="rounded-xl overflow-hidden"
        />
      </div>

      {/* P&L Summary Panel - compact in share mode */}
      <div className="px-4 pb-4">
        <PnLSummaryPanel
          pastPrice={pastPrice}
          currentPrice={currentPrice}
          pnl={pnl}
          currency={stock.currency}
          ticker={
            locale === "ko" && stock.nameKo
              ? stock.nameKo
              : stock.nameEn ?? stock.ticker
          }
          logoUrl={stock.logoUrl}
          buyDate={buyDate}
          locale={locale}
          theme={theme}
          compact={isShareVariant}
        />
      </div>

      {/* Cultural comparables — "could buy N chickens" */}
      {!isShareVariant && pnl.absolute != null && (
        <div className="px-4 pb-4">
          <ComparablesPanel
            absoluteAmount={pnl.absolute}
            currency={pnl.currency ?? stock.currency}
            locale={locale}
            isGain={pnl.absolute >= 0}
          />
        </div>
      )}

      {/* Branding footer */}
      {showBranding && <BrandingFooter theme={theme} locale={locale} />}

      {/* Actions (share, download, etc.) */}
      {actions && !forCapture && (
        <div className="flex justify-center gap-2 border-t px-4 py-4">
          {actions}
        </div>
      )}
    </div>
  );
});

// =============================================================================
// Skeleton Component for Loading State
// =============================================================================

export interface ResultVisualizationSkeletonProps {
  theme?: Theme;
  className?: string;
}

export function ResultVisualizationSkeleton({
  theme = "light",
  className = "",
}: ResultVisualizationSkeletonProps) {
  const isDark = theme === "dark";

  return (
    <div
      className={`
        overflow-hidden rounded-2xl animate-pulse
        ${isDark ? "bg-slate-800" : "bg-gray-100"}
        border ${isDark ? "border-slate-700" : "border-gray-200"}
        ${className}
      `}
      role="status"
      aria-label="Loading result..."
    >
      {/* Header skeleton */}
      <div
        className={`
          flex items-center justify-between px-4 py-3 border-b
          ${isDark ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-white/50"}
        `}
      >
        <div className="flex items-center gap-2">
          <div
            className={`h-5 w-20 rounded ${isDark ? "bg-slate-700" : "bg-gray-300"}`}
          />
          <div
            className={`h-4 w-12 rounded ${isDark ? "bg-slate-700" : "bg-gray-300"}`}
          />
        </div>
        <div
          className={`h-4 w-24 rounded ${isDark ? "bg-slate-700" : "bg-gray-300"}`}
        />
      </div>

      {/* Meme copy skeleton */}
      <div className="py-6 px-4 flex flex-col items-center gap-2">
        <div
          className={`h-8 w-48 rounded ${isDark ? "bg-slate-700" : "bg-gray-300"}`}
        />
        <div
          className={`h-5 w-36 rounded ${isDark ? "bg-slate-700" : "bg-gray-300"}`}
        />
      </div>

      {/* Percentage skeleton */}
      <div className="py-4 flex flex-col items-center gap-3">
        <div
          className={`h-14 w-40 rounded-lg ${isDark ? "bg-slate-700" : "bg-gray-300"}`}
        />
        <div
          className={`h-8 w-24 rounded-full ${isDark ? "bg-slate-700" : "bg-gray-300"}`}
        />
      </div>

      {/* Chart skeleton */}
      <div className="px-4 pb-4">
        <div
          className={`h-60 rounded-xl ${isDark ? "bg-slate-700" : "bg-gray-300"}`}
        />
      </div>

      {/* Summary skeleton */}
      <div className="px-4 pb-4">
        <div
          className={`h-16 rounded-xl ${isDark ? "bg-slate-700" : "bg-gray-300"}`}
        />
      </div>

      {/* Footer skeleton */}
      <div
        className={`
          flex items-center justify-center py-3 border-t
          ${isDark ? "border-slate-700" : "border-gray-200"}
        `}
      >
        <div
          className={`h-5 w-32 rounded ${isDark ? "bg-slate-700" : "bg-gray-300"}`}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Export Default
// =============================================================================

export default ResultVisualizationContainer;
