/**
 * Type tests for locale-aware formatting utilities
 *
 * This file verifies that formatting function types are correctly defined.
 * If this file compiles, the type system is correctly configured.
 */

import type { Locale, StockCurrency } from "@/types/stock";
import {
  formatCurrency,
  formatCurrencyWithSign,
  formatCurrencyCompact,
  formatNumber,
  formatPrice,
  formatPercent,
  formatPercentAbsolute,
  formatDate,
  formatResultDate,
  formatLargeNumber,
  formatShares,
  formatPnL,
  getCurrencySymbol,
  isValidNumberString,
  parseLocaleNumber,
  type CurrencyFormatOptions,
  type NumberFormatOptions,
  type PercentFormatOptions,
  type DateFormatOptions,
} from "@/lib/format";

// =============================================================================
// Type Assertions
// =============================================================================

// Verify formatCurrency signature
type FormatCurrencyFn = typeof formatCurrency;
type FormatCurrencyParams = Parameters<FormatCurrencyFn>;
type FormatCurrencyReturn = ReturnType<FormatCurrencyFn>;

// Params: [amount: number, currency: StockCurrency, locale?: Locale, options?: CurrencyFormatOptions]
const _currencyParams: FormatCurrencyParams = [1000, "KRW", "ko", { showSign: true }];
const _currencyResult: FormatCurrencyReturn = formatCurrency(1000, "KRW");

// Verify formatNumber signature
type FormatNumberFn = typeof formatNumber;
type FormatNumberParams = Parameters<FormatNumberFn>;
type FormatNumberReturn = ReturnType<FormatNumberFn>;

const _numberParams: FormatNumberParams = [1234, "en", { compact: true }];
const _numberResult: FormatNumberReturn = formatNumber(1234);

// Verify formatPercent signature
type FormatPercentFn = typeof formatPercent;
type FormatPercentParams = Parameters<FormatPercentFn>;
type FormatPercentReturn = ReturnType<FormatPercentFn>;

const _percentParams: FormatPercentParams = [15.5, "ko", { showSign: false }];
const _percentResult: FormatPercentReturn = formatPercent(15.5);

// Verify formatDate signature
type FormatDateFn = typeof formatDate;
type FormatDateParams = Parameters<FormatDateFn>;
type FormatDateReturn = ReturnType<FormatDateFn>;

const _dateParams: FormatDateParams = ["2024-01-15", "ko", { style: "long" }];
const _dateResult: FormatDateReturn = formatDate("2024-01-15");

// Verify formatPnL signature
type FormatPnLFn = typeof formatPnL;
type FormatPnLReturn = ReturnType<FormatPnLFn>;

const _pnlResult: FormatPnLReturn = formatPnL(50000, 15.5, "KRW", "ko");

// Verify PnL result structure
type PnLResultKeys = keyof FormatPnLReturn;
const _pnlKeys: PnLResultKeys[] = ["amount", "percent", "isPositive", "isNegative", "isFlat"];

// =============================================================================
// Currency Type Assertions
// =============================================================================

// Verify KRW and USD are valid currencies
const _krwCurrency: StockCurrency = "KRW";
const _usdCurrency: StockCurrency = "USD";

// Verify locale types
const _koLocale: Locale = "ko";
const _enLocale: Locale = "en";

// =============================================================================
// Option Type Assertions
// =============================================================================

// Currency format options
const _currencyOpts: CurrencyFormatOptions = {
  showSign: true,
  compact: true,
  compactPrecision: 3,
  narrow: true,
};

// Number format options
const _numberOpts: NumberFormatOptions = {
  minDecimals: 0,
  maxDecimals: 2,
  compact: true,
  showSign: true,
};

// Percent format options
const _percentOpts: PercentFormatOptions = {
  showSign: true,
  minDecimals: 1,
  maxDecimals: 2,
};

// Date format options
const _dateOpts: DateFormatOptions = {
  includeYear: true,
  style: "medium",
};

// =============================================================================
// Shorthand Function Assertions
// =============================================================================

// formatCurrencyWithSign
const _withSign: string = formatCurrencyWithSign(1000, "KRW", "ko");

// formatCurrencyCompact
const _compact: string = formatCurrencyCompact(150000000, "KRW", "ko");

// formatPrice
const _price: string = formatPrice(65000, "KRW", "ko");

// formatPercentAbsolute
const _percentAbs: string = formatPercentAbsolute(-15.5, "ko");

// formatResultDate
const _resultDate: string = formatResultDate("2024-01-15", "en");

// formatLargeNumber
const _largeNum: string = formatLargeNumber(150000000, "ko");

// formatShares
const _shares: string = formatShares(100.5, "en");

// getCurrencySymbol
const _symbol: string = getCurrencySymbol("USD", "en", true);

// isValidNumberString
const _isValid: boolean = isValidNumberString("1,234", "en");

// parseLocaleNumber
const _parsed: number | null = parseLocaleNumber("1,234.56", "en");

// =============================================================================
// Export for type checking
// =============================================================================

export const FORMAT_FUNCTIONS = {
  formatCurrency,
  formatCurrencyWithSign,
  formatCurrencyCompact,
  formatNumber,
  formatPrice,
  formatPercent,
  formatPercentAbsolute,
  formatDate,
  formatResultDate,
  formatLargeNumber,
  formatShares,
  formatPnL,
  getCurrencySymbol,
  isValidNumberString,
  parseLocaleNumber,
} as const;

export type {
  CurrencyFormatOptions,
  NumberFormatOptions,
  PercentFormatOptions,
  DateFormatOptions,
};

// Use all variables to prevent unused warnings
void _currencyParams;
void _currencyResult;
void _numberParams;
void _numberResult;
void _percentParams;
void _percentResult;
void _dateParams;
void _dateResult;
void _pnlResult;
void _pnlKeys;
void _krwCurrency;
void _usdCurrency;
void _koLocale;
void _enLocale;
void _currencyOpts;
void _numberOpts;
void _percentOpts;
void _dateOpts;
void _withSign;
void _compact;
void _price;
void _percentAbs;
void _resultDate;
void _largeNum;
void _shares;
void _symbol;
void _isValid;
void _parsed;
