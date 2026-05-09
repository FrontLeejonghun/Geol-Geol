"use client";

/**
 * P&L Summary Panel Component
 *
 * Displays key gain/loss metrics for the stock regret calculator:
 * - Purchase price (past price on buy date)
 * - Current price (latest close)
 * - Percentage change
 * - Absolute gain/loss (if virtual amount provided)
 *
 * Features:
 * - Color-coded gain/loss indicators
 * - Dark/light theme support
 * - Locale-aware currency/number formatting
 * - Outcome tier visual styling
 * - Mobile-first responsive design
 */

import type {
  PnL,
  StockCurrency,
  Locale,
  Theme,
  OutcomeTier,
} from "@/types/stock";
import { formatCurrency, formatPercent } from "@/lib/format";

// =============================================================================
// Types
// =============================================================================

export interface PnLSummaryPanelProps {
  /** Adjusted close price on buy date */
  pastPrice: number;
  /** Latest available close price */
  currentPrice: number;
  /** P&L calculation result */
  pnl: PnL;
  /** Stock currency */
  currency: StockCurrency;
  /** Stock ticker symbol for display */
  ticker?: string;
  /** Optional logo URL — replaces the tier emoji when provided */
  logoUrl?: string;
  /** Resolved buy date for display */
  buyDate?: string;
  /** Display locale */
  locale?: Locale;
  /** Theme for styling */
  theme?: Theme;
  /** Additional CSS classes */
  className?: string;
  /** Show compact version (no labels, just values) */
  compact?: boolean;
}

// =============================================================================
// Theme & Styling
// =============================================================================

interface OutcomeTierStyles {
  /** Background color for the outcome badge */
  badgeBg: string;
  /** Text color for the outcome badge */
  badgeText: string;
  /** Border accent color */
  borderAccent: string;
  /** Primary text color for change values */
  changeColor: string;
  /** Icon emoji */
  icon: string;
}

// Neutral shadcn-style palette — only the change color carries direction.
const NEUTRAL_TIER = {
  badgeBg: "bg-muted",
  badgeText: "text-muted-foreground",
  borderAccent: "border-border",
} as const;

const OUTCOME_TIER_STYLES: Record<
  Theme,
  Record<OutcomeTier, OutcomeTierStyles>
> = {
  light: {
    catastrophe: { ...NEUTRAL_TIER, changeColor: "text-red-600", icon: "💀" },
    loss: { ...NEUTRAL_TIER, changeColor: "text-red-600", icon: "📉" },
    flat: { ...NEUTRAL_TIER, changeColor: "text-foreground", icon: "😐" },
    gain: { ...NEUTRAL_TIER, changeColor: "text-emerald-600", icon: "📈" },
    jackpot: { ...NEUTRAL_TIER, changeColor: "text-emerald-600", icon: "🚀" },
  },
  dark: {
    catastrophe: { ...NEUTRAL_TIER, changeColor: "text-red-600", icon: "💀" },
    loss: { ...NEUTRAL_TIER, changeColor: "text-red-600", icon: "📉" },
    flat: { ...NEUTRAL_TIER, changeColor: "text-foreground", icon: "😐" },
    gain: { ...NEUTRAL_TIER, changeColor: "text-emerald-600", icon: "📈" },
    jackpot: { ...NEUTRAL_TIER, changeColor: "text-emerald-600", icon: "🚀" },
  },
};

const OUTCOME_TIER_LABELS: Record<Locale, Record<OutcomeTier, string>> = {
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
// Sub-components
// =============================================================================

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  theme: Theme;
  highlight?: boolean;
  highlightColor?: string;
}

function MetricCard({
  label,
  value,
  subValue,
  theme,
  highlight = false,
  highlightColor,
}: MetricCardProps) {
  return (
    <div
      className={`
        flex flex-col rounded-lg p-3
        ${
          theme === "dark"
            ? "bg-slate-800/50 border border-slate-700"
            : "bg-white border border-gray-100 shadow-sm"
        }
      `}
    >
      <span
        className={`
          text-xs font-medium uppercase tracking-wide mb-1
          ${theme === "dark" ? "text-slate-300" : "text-gray-600"}
        `}
      >
        {label}
      </span>
      <span
        className={`
          text-lg font-bold leading-tight
          ${
            highlight && highlightColor
              ? highlightColor
              : theme === "dark"
                ? "text-slate-100"
                : "text-gray-900"
          }
        `}
      >
        {value}
      </span>
      {subValue && (
        <span
          className={`
            text-xs mt-0.5
            ${theme === "dark" ? "text-slate-300" : "text-gray-500"}
          `}
        >
          {subValue}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PnLSummaryPanel({
  pastPrice,
  currentPrice,
  pnl,
  currency,
  ticker,
  logoUrl,
  buyDate,
  locale = "ko",
  theme = "light",
  className = "",
  compact = false,
}: PnLSummaryPanelProps) {
  const tierStyles = OUTCOME_TIER_STYLES[theme][pnl.outcomeTier];
  const tierLabel = OUTCOME_TIER_LABELS[locale][pnl.outcomeTier];

  // Format values
  const formattedPastPrice = formatCurrency(pastPrice, currency, locale);
  const formattedCurrentPrice = formatCurrency(currentPrice, currency, locale);
  const formattedPercent = formatPercent(pnl.percent, locale);
  const formattedAbsolute = pnl.absolute !== null
    ? (pnl.absolute >= 0 ? "+" : "") + formatCurrency(Math.abs(pnl.absolute), currency, locale)
    : null;

  // Calculate price change for display
  const priceChange = currentPrice - pastPrice;
  const formattedPriceChange =
    (priceChange >= 0 ? "+" : "") + formatCurrency(Math.abs(priceChange), currency, locale);

  // Labels based on locale
  const labels = {
    ko: {
      purchasePrice: "매수가",
      currentPrice: "현재가",
      change: "변동",
      absoluteGainLoss: "손익금액",
      on: "일 기준",
    },
    en: {
      purchasePrice: "Purchase Price",
      currentPrice: "Current Price",
      change: "Change",
      absoluteGainLoss: "Gain/Loss",
      on: "as of",
    },
  }[locale];

  // Compact mode: just the essential metrics inline
  if (compact) {
    return (
      <div
        className={`
          flex items-center justify-between gap-4 p-3 rounded-xl
          ${theme === "dark" ? "bg-slate-800/80" : "bg-gray-50"}
          ${className}
        `}
        role="region"
        aria-label={locale === "ko" ? "손익 요약" : "P&L Summary"}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            {tierStyles.icon}
          </span>
          <span
            className={`
              text-lg font-bold
              ${tierStyles.changeColor}
            `}
          >
            {formattedPercent}
          </span>
        </div>
        <div
          className={`
            text-sm
            ${theme === "dark" ? "text-slate-300" : "text-gray-600"}
          `}
        >
          {formattedPastPrice} → {formattedCurrentPrice}
        </div>
      </div>
    );
  }

  // Full mode: detailed panel with all metrics
  return (
    <div
      className={`
        rounded-2xl overflow-hidden
        ${theme === "dark" ? "bg-slate-900/80 border border-slate-700" : "bg-gray-50 border border-gray-200"}
        ${className}
      `}
      role="region"
      aria-label={locale === "ko" ? "손익 상세" : "P&L Details"}
    >
      {/* Header with outcome tier badge */}
      <div
        className={`
          px-4 py-3 flex items-center justify-between border-b
          ${tierStyles.borderAccent}
          ${theme === "dark" ? "bg-slate-800/50" : "bg-white"}
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              width={32}
              height={32}
              loading="lazy"
              className="h-8 w-8 shrink-0 rounded-md bg-white object-contain p-0.5 ring-1 ring-gray-200"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-2xl" aria-hidden="true">
              {tierStyles.icon}
            </span>
          )}
          {ticker && (
            <span className="truncate font-semibold text-lg text-gray-900">
              {ticker}
            </span>
          )}
        </div>
        <span
          className={`
            px-3 py-1 rounded-full text-sm font-semibold
            ${tierStyles.badgeBg} ${tierStyles.badgeText}
          `}
          role="status"
          aria-label={`${locale === "ko" ? "결과" : "Result"}: ${tierLabel}`}
        >
          {tierLabel}
        </span>
      </div>

      {/* Main percentage display */}
      <div
        className={`
          px-4 py-5 text-center border-b
          ${tierStyles.borderAccent}
          ${theme === "dark" ? "bg-slate-800/30" : "bg-white/50"}
        `}
      >
        <p
          className={`
            text-4xl sm:text-5xl font-bold tracking-tight
            ${tierStyles.changeColor}
          `}
          aria-live="polite"
        >
          {formattedPercent}
        </p>
        {buyDate && (
          <p
            className={`
              text-sm mt-1
              ${theme === "dark" ? "text-slate-300" : "text-gray-600"}
            `}
          >
            {buyDate} {labels.on}
          </p>
        )}
      </div>

      {/* Metrics grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <MetricCard
          label={labels.purchasePrice}
          value={formattedPastPrice}
          subValue={buyDate}
          theme={theme}
        />
        <MetricCard
          label={labels.currentPrice}
          value={formattedCurrentPrice}
          subValue={formattedPriceChange}
          theme={theme}
          highlight
          highlightColor={tierStyles.changeColor}
        />
      </div>

      {/* Absolute gain/loss (if virtual amount was provided) */}
      {formattedAbsolute && (
        <div
          className={`
            px-4 pb-4
          `}
        >
          <MetricCard
            label={labels.absoluteGainLoss}
            value={formattedAbsolute}
            theme={theme}
            highlight
            highlightColor={tierStyles.changeColor}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Export Default
// =============================================================================

export default PnLSummaryPanel;
