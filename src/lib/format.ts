/**
 * Locale-Aware Currency and Number Formatting Utilities
 *
 * Provides comprehensive formatting for KRW/USD currencies and numbers
 * using Intl.NumberFormat with locale-specific rules.
 *
 * Key features:
 * - KRW: No decimals, Korean locale formatting
 * - USD: 2 decimal places, US locale formatting
 * - Compact notation for large numbers (e.g., "1.5억", "$15M")
 * - Sign-aware formatting for gains/losses
 * - Percentage formatting with sign indicators
 */

import type { Locale, StockCurrency } from "@/types/stock";

// =============================================================================
// Types
// =============================================================================

/**
 * Options for currency formatting
 */
export interface CurrencyFormatOptions {
  /** Whether to show +/- sign for positive/negative values */
  showSign?: boolean;
  /** Use compact notation for large numbers (e.g., "1.5억", "$1.5M") */
  compact?: boolean;
  /** Number of significant digits for compact notation (default: 3) */
  compactPrecision?: number;
  /** Narrow currency symbol (₩ instead of KRW) */
  narrow?: boolean;
}

/**
 * Options for number formatting
 */
export interface NumberFormatOptions {
  /** Minimum fraction digits */
  minDecimals?: number;
  /** Maximum fraction digits */
  maxDecimals?: number;
  /** Use compact notation for large numbers */
  compact?: boolean;
  /** Whether to show +/- sign */
  showSign?: boolean;
}

/**
 * Options for percentage formatting
 */
export interface PercentFormatOptions {
  /** Whether to show +/- sign (default: true) */
  showSign?: boolean;
  /** Minimum fraction digits (default: 2) */
  minDecimals?: number;
  /** Maximum fraction digits (default: 2) */
  maxDecimals?: number;
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Get the Intl locale string for a given app locale
 */
function getIntlLocale(locale: Locale): string {
  return locale === "ko" ? "ko-KR" : "en-US";
}

/**
 * Get decimal places for a currency.
 * Both KRW and USD render as integers in this app — small fractional cents
 * are noise for the meme/share use-case.
 */
function getCurrencyDecimals(_currency: StockCurrency): number {
  return 0;
}

/**
 * Get compact thresholds and suffixes based on locale and currency
 */
function getCompactConfig(locale: Locale, _currency: StockCurrency): {
  thresholds: number[];
  suffixes: string[];
  divisors: number[];
} {
  if (locale === "ko") {
    // Korean uses 만 (10,000) and 억 (100,000,000)
    return {
      thresholds: [100_000_000, 10_000],
      suffixes: ["억", "만"],
      divisors: [100_000_000, 10_000],
    };
  }
  // English uses M (million) and K (thousand)
  return {
    thresholds: [1_000_000, 1_000],
    suffixes: ["M", "K"],
    divisors: [1_000_000, 1_000],
  };
}

// =============================================================================
// Currency Formatting
// =============================================================================

/**
 * Format a number as currency with locale-aware formatting
 *
 * @param amount - Amount to format
 * @param currency - Currency code (KRW or USD)
 * @param locale - Display locale (ko or en)
 * @param options - Formatting options
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1500000, 'KRW', 'ko') // "₩1,500,000"
 * formatCurrency(1500000, 'KRW', 'ko', { compact: true }) // "₩150만"
 * formatCurrency(-1234.56, 'USD', 'en', { showSign: true }) // "-$1,234.56"
 * formatCurrency(1234.56, 'USD', 'en', { showSign: true }) // "+$1,234.56"
 */
export function formatCurrency(
  amount: number,
  currency: StockCurrency,
  locale: Locale = "ko",
  options: CurrencyFormatOptions = {}
): string {
  const {
    showSign = false,
    compact = false,
    compactPrecision = 3,
    narrow = true,
  } = options;

  const intlLocale = getIntlLocale(locale);
  const decimals = getCurrencyDecimals(currency);
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  const signPrefix = showSign ? (isNegative ? "" : "+") : "";

  // Handle compact notation manually for better control
  if (compact && absAmount >= 10_000) {
    const config = getCompactConfig(locale, currency);

    for (let i = 0; i < config.thresholds.length; i++) {
      if (absAmount >= config.thresholds[i]!) {
        const scaledValue = absAmount / config.divisors[i]!;

        // Format the scaled number
        const formatter = new Intl.NumberFormat(intlLocale, {
          minimumFractionDigits: 0,
          maximumFractionDigits: compactPrecision - 1,
          maximumSignificantDigits: compactPrecision,
        });

        const formattedNumber = formatter.format(scaledValue);
        const suffix = config.suffixes[i];

        // Format currency symbol
        const currencyFormatter = new Intl.NumberFormat(intlLocale, {
          style: "currency",
          currency,
          currencyDisplay: narrow ? "narrowSymbol" : "symbol",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });

        // Extract currency symbol from a formatted number
        const parts = currencyFormatter.formatToParts(1);
        const symbolPart = parts.find((p) => p.type === "currency");
        const currencySymbol = symbolPart?.value || currency;

        // Build the final string based on locale conventions
        if (locale === "ko") {
          // Korean: ₩150만
          return `${isNegative ? "-" : signPrefix}${currencySymbol}${formattedNumber}${suffix}`;
        } else {
          // English: $1.5M
          return `${isNegative ? "-" : signPrefix}${currencySymbol}${formattedNumber}${suffix}`;
        }
      }
    }
  }

  // Standard formatting
  const formatter = new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    currencyDisplay: narrow ? "narrowSymbol" : "symbol",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const formatted = formatter.format(absAmount);

  if (isNegative) {
    return `-${formatted}`;
  }

  return showSign && amount > 0 ? `+${formatted}` : formatted;
}

/**
 * Format currency with sign (shorthand for gains/losses)
 *
 * @param amount - Amount to format
 * @param currency - Currency code
 * @param locale - Display locale
 * @returns Formatted currency string with +/- sign
 */
export function formatCurrencyWithSign(
  amount: number,
  currency: StockCurrency,
  locale: Locale = "ko"
): string {
  return formatCurrency(amount, currency, locale, { showSign: true });
}

/**
 * Format currency in compact notation (shorthand)
 *
 * @param amount - Amount to format
 * @param currency - Currency code
 * @param locale - Display locale
 * @returns Compact formatted currency string
 */
export function formatCurrencyCompact(
  amount: number,
  currency: StockCurrency,
  locale: Locale = "ko"
): string {
  return formatCurrency(amount, currency, locale, { compact: true });
}

// =============================================================================
// Number Formatting
// =============================================================================

/**
 * Format a number with locale-aware thousands separators
 *
 * @param value - Number to format
 * @param locale - Display locale
 * @param options - Formatting options
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234567.89, 'ko') // "1,234,567.89"
 * formatNumber(1234567.89, 'en', { compact: true }) // "1.23M"
 * formatNumber(-1234, 'ko', { showSign: true }) // "-1,234"
 * formatNumber(1234, 'ko', { showSign: true }) // "+1,234"
 */
export function formatNumber(
  value: number,
  locale: Locale = "ko",
  options: NumberFormatOptions = {}
): string {
  const {
    minDecimals = 0,
    maxDecimals = 2,
    compact = false,
    showSign = false,
  } = options;

  const intlLocale = getIntlLocale(locale);
  const absValue = Math.abs(value);
  const isNegative = value < 0;

  // Handle compact notation
  if (compact && absValue >= 1_000) {
    // Use Intl's built-in compact notation
    const formatter = new Intl.NumberFormat(intlLocale, {
      notation: "compact",
      compactDisplay: "short",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });

    const formatted = formatter.format(absValue);

    if (isNegative) {
      return `-${formatted}`;
    }

    return showSign && value > 0 ? `+${formatted}` : formatted;
  }

  // Standard formatting
  const formatter = new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });

  const formatted = formatter.format(absValue);

  if (isNegative) {
    return `-${formatted}`;
  }

  return showSign && value > 0 ? `+${formatted}` : formatted;
}

/**
 * Format a stock price with appropriate decimals based on currency
 *
 * @param price - Price value
 * @param currency - Stock currency (determines decimal places)
 * @param locale - Display locale
 * @returns Formatted price string (without currency symbol)
 */
export function formatPrice(
  price: number,
  currency: StockCurrency,
  locale: Locale = "ko"
): string {
  const decimals = getCurrencyDecimals(currency);
  return formatNumber(price, locale, {
    minDecimals: decimals,
    maxDecimals: decimals,
  });
}

// =============================================================================
// Percentage Formatting
// =============================================================================

/**
 * Format a percentage value with locale-aware formatting
 *
 * @param percent - Percentage value (e.g., 15.5 for 15.5%)
 * @param locale - Display locale
 * @param options - Formatting options
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(15.5, 'ko') // "+15.50%"
 * formatPercent(-10.25, 'en') // "-10.25%"
 * formatPercent(0, 'ko') // "0.00%"
 */
export function formatPercent(
  percent: number,
  locale: Locale = "ko",
  options: PercentFormatOptions = {}
): string {
  const { showSign = true, minDecimals = 0, maxDecimals = 0 } = options;

  const intlLocale = getIntlLocale(locale);

  // Convert percentage to decimal for Intl.NumberFormat
  // e.g., 15.5% => 0.155
  const decimalValue = percent / 100;

  const formatter = new Intl.NumberFormat(intlLocale, {
    style: "percent",
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });

  const formatted = formatter.format(Math.abs(decimalValue));

  if (percent < 0) {
    return `-${formatted}`;
  }

  if (showSign && percent > 0) {
    return `+${formatted}`;
  }

  return formatted;
}

/**
 * Format percentage without sign (for cases where sign is handled separately)
 */
export function formatPercentAbsolute(
  percent: number,
  locale: Locale = "ko",
  options: Omit<PercentFormatOptions, "showSign"> = {}
): string {
  return formatPercent(Math.abs(percent), locale, { ...options, showSign: false });
}

// =============================================================================
// Date Formatting
// =============================================================================

/**
 * Options for date formatting
 */
export interface DateFormatOptions {
  /** Include year (default: true) */
  includeYear?: boolean;
  /** Format style: 'short' | 'medium' | 'long' (default: 'short') */
  style?: "short" | "medium" | "long";
}

/**
 * Format a date string with locale-aware formatting
 *
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @param locale - Display locale
 * @param options - Formatting options
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-01-15', 'ko') // "2024.01.15" or "2024년 1월 15일"
 * formatDate('2024-01-15', 'en') // "Jan 15, 2024"
 */
export function formatDate(
  dateStr: string,
  locale: Locale = "ko",
  options: DateFormatOptions = {}
): string {
  const { includeYear = true, style = "short" } = options;

  const intlLocale = getIntlLocale(locale);

  // Parse the date string
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) {
    return dateStr; // Return original if parsing fails
  }

  const date = new Date(year, month - 1, day);

  // Determine formatting options based on style
  let dateTimeOptions: Intl.DateTimeFormatOptions;

  switch (style) {
    case "long":
      dateTimeOptions = {
        year: includeYear ? "numeric" : undefined,
        month: "long",
        day: "numeric",
      };
      break;
    case "medium":
      dateTimeOptions = {
        year: includeYear ? "numeric" : undefined,
        month: "short",
        day: "numeric",
      };
      break;
    case "short":
    default:
      if (locale === "ko") {
        // Korean short format: YYYY.MM.DD
        dateTimeOptions = {
          year: includeYear ? "numeric" : undefined,
          month: "2-digit",
          day: "2-digit",
        };
      } else {
        dateTimeOptions = {
          year: includeYear ? "numeric" : undefined,
          month: "short",
          day: "numeric",
        };
      }
      break;
  }

  const formatter = new Intl.DateTimeFormat(intlLocale, dateTimeOptions);
  return formatter.format(date);
}

/**
 * Format a date for display in results (consistent format)
 *
 * @param dateStr - ISO date string
 * @param locale - Display locale
 * @returns Formatted date string
 */
export function formatResultDate(dateStr: string, locale: Locale = "ko"): string {
  return formatDate(dateStr, locale, { style: "medium" });
}

// =============================================================================
// Special Formatting Utilities
// =============================================================================

/**
 * Format a P&L value with appropriate styling hints
 *
 * @param amount - P&L amount
 * @param percent - P&L percentage
 * @param currency - Currency code
 * @param locale - Display locale
 * @returns Object with formatted values and styling hints
 */
export function formatPnL(
  amount: number | null,
  percent: number,
  currency: StockCurrency,
  locale: Locale = "ko"
): {
  amount: string | null;
  percent: string;
  isPositive: boolean;
  isNegative: boolean;
  isFlat: boolean;
} {
  const isPositive = percent > 0;
  const isNegative = percent < 0;
  const isFlat = Math.abs(percent) < 0.01;

  return {
    amount: amount !== null ? formatCurrencyWithSign(amount, currency, locale) : null,
    percent: formatPercent(percent, locale),
    isPositive,
    isNegative,
    isFlat,
  };
}

/**
 * Format share count (number of shares that could be purchased)
 *
 * @param shares - Number of shares
 * @param locale - Display locale
 * @returns Formatted share count
 */
export function formatShares(shares: number, locale: Locale = "ko"): string {
  const intlLocale = getIntlLocale(locale);

  // Shares are typically displayed with up to 4 decimal places
  const formatter = new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });

  return formatter.format(shares);
}

/**
 * Format a large number in a human-readable way with locale-appropriate units
 *
 * @param value - Number to format
 * @param locale - Display locale
 * @returns Human-readable number string
 *
 * @example
 * formatLargeNumber(1500000000, 'ko') // "15억"
 * formatLargeNumber(1500000000, 'en') // "1.5B"
 * formatLargeNumber(15000, 'ko') // "1.5만"
 * formatLargeNumber(15000, 'en') // "15K"
 */
export function formatLargeNumber(value: number, locale: Locale = "ko"): string {
  const absValue = Math.abs(value);
  const isNegative = value < 0;
  const intlLocale = getIntlLocale(locale);

  if (locale === "ko") {
    // Korean number units
    if (absValue >= 1_000_000_000_000) {
      // 조 (trillion)
      const scaled = absValue / 1_000_000_000_000;
      const formatted = new Intl.NumberFormat(intlLocale, {
        maximumFractionDigits: 1,
      }).format(scaled);
      return `${isNegative ? "-" : ""}${formatted}조`;
    }
    if (absValue >= 100_000_000) {
      // 억 (hundred million)
      const scaled = absValue / 100_000_000;
      const formatted = new Intl.NumberFormat(intlLocale, {
        maximumFractionDigits: 1,
      }).format(scaled);
      return `${isNegative ? "-" : ""}${formatted}억`;
    }
    if (absValue >= 10_000) {
      // 만 (ten thousand)
      const scaled = absValue / 10_000;
      const formatted = new Intl.NumberFormat(intlLocale, {
        maximumFractionDigits: 1,
      }).format(scaled);
      return `${isNegative ? "-" : ""}${formatted}만`;
    }
  } else {
    // English number units (use Intl compact notation)
    if (absValue >= 1_000) {
      const formatter = new Intl.NumberFormat(intlLocale, {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1,
      });
      const formatted = formatter.format(absValue);
      return isNegative ? `-${formatted}` : formatted;
    }
  }

  // Small numbers: format normally
  const formatter = new Intl.NumberFormat(intlLocale, {
    maximumFractionDigits: 2,
  });
  const formatted = formatter.format(absValue);
  return isNegative ? `-${formatted}` : formatted;
}

// =============================================================================
// Utility: Currency Symbol Extraction
// =============================================================================

/**
 * Get the currency symbol for a given currency code
 *
 * @param currency - Currency code
 * @param locale - Display locale
 * @param narrow - Use narrow symbol (default: true)
 * @returns Currency symbol
 */
export function getCurrencySymbol(
  currency: StockCurrency,
  locale: Locale = "ko",
  narrow = true
): string {
  const intlLocale = getIntlLocale(locale);
  const formatter = new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    currencyDisplay: narrow ? "narrowSymbol" : "symbol",
  });

  const parts = formatter.formatToParts(0);
  const symbolPart = parts.find((p) => p.type === "currency");
  return symbolPart?.value || currency;
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Check if a string is a valid number in the given locale
 */
export function isValidNumberString(value: string, locale: Locale = "ko"): boolean {
  const intlLocale = getIntlLocale(locale);

  // Get locale-specific decimal separator
  const formatter = new Intl.NumberFormat(intlLocale);
  const parts = formatter.formatToParts(1.1);
  const decimalSeparator = parts.find((p) => p.type === "decimal")?.value || ".";

  // Remove thousands separators and check if valid
  const groupSeparator = parts.find((p) => p.type === "group")?.value || ",";
  const normalized = value
    .replace(new RegExp(`\\${groupSeparator}`, "g"), "")
    .replace(decimalSeparator, ".");

  return !isNaN(Number(normalized)) && normalized.trim() !== "";
}

/**
 * Parse a locale-formatted number string to a number
 */
export function parseLocaleNumber(value: string, locale: Locale = "ko"): number | null {
  const intlLocale = getIntlLocale(locale);

  // Get locale-specific separators
  const formatter = new Intl.NumberFormat(intlLocale);
  const parts = formatter.formatToParts(1234.5);
  const decimalSeparator = parts.find((p) => p.type === "decimal")?.value || ".";
  const groupSeparator = parts.find((p) => p.type === "group")?.value || ",";

  // Normalize the string
  const normalized = value
    .replace(new RegExp(`\\${groupSeparator}`, "g"), "")
    .replace(decimalSeparator, ".");

  const parsed = Number(normalized);
  return isNaN(parsed) ? null : parsed;
}
