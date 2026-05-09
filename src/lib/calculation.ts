/**
 * Stock Calculation Service
 *
 * Computes P&L (profit/loss) and other derived values for
 * the stock-regret calculator.
 */

import type {
  Stock,
  PnL,
  OutcomeTier,
  MemeCopy,
  Locale,
  CalculationResult,
  StockCalculationInput,
  StockCurrency,
} from "@/types/stock";
import { getOutcomeTier } from "@/types/stock";
import {
  getQuote,
  getHistoricalPrices,
  getPriceOnDate,
  getQuoteSafe,
  getHistoricalPricesSafe,
  getPriceOnDateSafe,
  type YahooFinanceResult,
  type YahooFinanceErrorInfo,
  createSuccess,
  createError,
  getUsdKrwRate,
} from "./yahoo-finance";

// =============================================================================
// P&L Calculation
// =============================================================================

/**
 * Calculate P&L from past and current prices
 *
 * @param pastPrice - Adjusted close price on buy date
 * @param currentPrice - Current/latest close price
 * @param virtualAmount - Optional hypothetical purchase amount
 * @param currency - Currency code for the stock
 * @returns PnL calculation result
 */
export function calculatePnL(
  pastPrice: number,
  currentPrice: number,
  virtualAmount: number | undefined,
  currency: StockCurrency
): PnL {
  // Calculate percentage change
  const percentChange = ((currentPrice - pastPrice) / pastPrice) * 100;

  // Calculate absolute change if virtualAmount is provided
  let absoluteChange: number | null = null;
  if (virtualAmount !== undefined && virtualAmount > 0) {
    // How many shares could be bought with virtualAmount at pastPrice
    const shares = virtualAmount / pastPrice;
    // Current value of those shares
    const currentValue = shares * currentPrice;
    // Absolute gain/loss
    absoluteChange = currentValue - virtualAmount;
  }

  // Determine outcome tier based on percentage
  const outcomeTier = getOutcomeTier(percentChange);

  return {
    absolute: absoluteChange,
    percent: percentChange,
    currency,
    outcomeTier,
  };
}

// =============================================================================
// Meme Copy Selection
// =============================================================================

/**
 * Meme copy pool organized by locale and outcome tier
 * Each outcome tier has an array of possible copies for variety
 *
 * Korean copies are designed for viral self-deprecating SNS sharing ("그때 살껄...")
 * with emotionally resonant expressions that capture the regret/relief spectrum
 */
// Re-export the pool & helpers from the edge-safe module so existing
// imports like `import { selectMemeCopy } from "@/lib/calculation"` keep
// working. New edge-runtime callers should import from `@/lib/meme-copy`
// directly to avoid pulling Yahoo dependencies through this module.
import {
  MEME_COPY_POOL,
  selectMemeCopy,
  getAllMemeCopies,
} from "./meme-copy";
export { MEME_COPY_POOL, selectMemeCopy, getAllMemeCopies };

// Legacy in-file pool removed — see `@/lib/meme-copy`.

/**
 * Combined utility: Get random meme copy from profit percentage and locale
 *
 * This is the main utility function for selecting meme copy based on P&L.
 * It combines tier determination and randomized copy selection in one call.
 *
 * @param profitPercent - The profit/loss percentage (e.g., -25, 0, 150)
 * @param locale - User's locale ('ko' | 'en')
 * @returns Random meme copy object with headline and subline
 *
 * @example
 * // User lost 75% -> catastrophe tier -> relief copy
 * getMemeCopyFromProfit(-75, 'ko')
 * // Returns: { headline: "와... 안 사길 잘했다", subline: "큰일날 뻔 😰" }
 *
 * @example
 * // User gained 150% -> jackpot tier -> intense regret copy
 * getMemeCopyFromProfit(150, 'en')
 * // Returns: { headline: "SHOULD'VE BOUGHT!!!", subline: "Would be a millionaire!!! 😭" }
 */
export function getMemeCopyFromProfit(
  profitPercent: number,
  locale: Locale
): MemeCopy {
  const tier = getOutcomeTier(profitPercent);
  return selectMemeCopy(locale, tier);
}

/**
 * Get outcome tier and meme copy together from profit percentage
 *
 * Useful when you need both the tier (for styling) and copy (for display)
 *
 * @param profitPercent - The profit/loss percentage
 * @param locale - User's locale
 * @returns Object with both tier and randomly selected meme copy
 */
export function getTierAndCopy(
  profitPercent: number,
  locale: Locale
): { tier: OutcomeTier; copy: MemeCopy } {
  const tier = getOutcomeTier(profitPercent);
  const copy = selectMemeCopy(locale, tier);
  return { tier, copy };
}

// =============================================================================
// Full Calculation
// =============================================================================

/**
 * Perform complete stock calculation
 *
 * Fetches stock data, resolves trading day, computes P&L, and selects meme copy.
 *
 * @param input - User input with ticker, buyDate, and optional virtualAmount
 * @param locale - Locale for meme copy selection
 * @returns Complete calculation result
 */
export async function calculateStockRegret(
  input: StockCalculationInput,
  locale: Locale = "ko"
): Promise<CalculationResult> {
  const { ticker, buyDate, virtualAmount } = input;

  // Step 1: Get current quote for stock info
  const stockQuote = await getQuote(ticker);
  const stock: Stock = {
    ticker: stockQuote.ticker,
    name: stockQuote.name,
    nameEn: stockQuote.nameEn,
    nameKo: stockQuote.nameKo,
    industry: stockQuote.industry,
    industryKo: stockQuote.industryKo,
    logoUrl: stockQuote.logoUrl,
    exchange: stockQuote.exchange,
    market: stockQuote.market,
    currency: stockQuote.currency,
    marketHours: stockQuote.marketHours,
  };

  // Step 2: Get price on buy date (resolves to nearest trading day)
  const { resolvedDate, price: pastPrice } = await getPriceOnDate(ticker, buyDate);

  // Step 3: Get historical price data from resolved buy date to today
  const priceHistory = await getHistoricalPrices(ticker, resolvedDate);

  // Step 4: Calculate P&L
  const currentPrice = stockQuote.currentPrice;
  const pnl = calculatePnL(pastPrice, currentPrice, virtualAmount, stock.currency);

  // Step 5: Select meme copy based on outcome
  const memeCopy = selectMemeCopy(locale, pnl.outcomeTier);

  // Step 6: Construct result
  const result: CalculationResult = {
    input,
    stock,
    rawBuyDate: buyDate,
    resolvedBuyDate: resolvedDate,
    pastPrice,
    currentPrice,
    pnl,
    memeCopy,
    priceHistory,
    calculatedAt: new Date().toISOString(),
  };

  return result;
}

// =============================================================================
// Safe Calculation (Returns Result type instead of throwing)
// =============================================================================

/**
 * Perform complete stock calculation - safe version
 *
 * Returns a Result type instead of throwing exceptions.
 * All Yahoo Finance errors are caught and returned as structured error info.
 *
 * @param input - User input with ticker, buyDate, and optional virtualAmount
 * @param locale - Locale for meme copy selection
 * @returns Result with calculation data or structured error info
 */
export async function calculateStockRegretSafe(
  input: StockCalculationInput,
  locale: Locale = "ko"
): Promise<YahooFinanceResult<CalculationResult>> {
  const { ticker, buyDate, virtualAmount, amountCurrency } = input;

  // Step 1: Get current quote for stock info
  const quoteResult = await getQuoteSafe(ticker);
  if (!quoteResult.success) {
    return createError({
      ...quoteResult.error,
      context: { ...quoteResult.error.context, step: "getQuote", ticker },
    });
  }

  const stockQuote = quoteResult.data;
  const stock: Stock = {
    ticker: stockQuote.ticker,
    name: stockQuote.name,
    nameEn: stockQuote.nameEn,
    nameKo: stockQuote.nameKo,
    industry: stockQuote.industry,
    industryKo: stockQuote.industryKo,
    logoUrl: stockQuote.logoUrl,
    exchange: stockQuote.exchange,
    market: stockQuote.market,
    currency: stockQuote.currency,
    marketHours: stockQuote.marketHours,
  };

  // Step 2: Get price on buy date (resolves to nearest trading day)
  const priceOnDateResult = await getPriceOnDateSafe(ticker, buyDate);
  if (!priceOnDateResult.success) {
    return createError({
      ...priceOnDateResult.error,
      context: { ...priceOnDateResult.error.context, step: "getPriceOnDate", ticker, buyDate },
    });
  }

  const { resolvedDate, price: pastPrice } = priceOnDateResult.data;

  // Step 3: Get historical price data from resolved buy date to today
  const historyResult = await getHistoricalPricesSafe(ticker, resolvedDate);
  if (!historyResult.success) {
    return createError({
      ...historyResult.error,
      context: { ...historyResult.error.context, step: "getHistoricalPrices", ticker, resolvedDate },
    });
  }

  const priceHistory = historyResult.data;

  // Step 4: Calculate P&L
  const currentPrice = stockQuote.currentPrice;

  // If user typed amount in a different currency, convert it to the stock
  // currency before computing shares — uses the latest USD/KRW rate (no
  // historical FX). This drives the user-facing display currency too.
  const displayCurrency = amountCurrency ?? stock.currency;
  let virtualAmountInStock = virtualAmount;
  let fxRate: number | null = null;
  if (
    virtualAmount !== undefined &&
    displayCurrency !== stock.currency
  ) {
    try {
      fxRate = await getUsdKrwRate();
      virtualAmountInStock =
        displayCurrency === "USD" && stock.currency === "KRW"
          ? virtualAmount * fxRate
          : displayCurrency === "KRW" && stock.currency === "USD"
            ? virtualAmount / fxRate
            : virtualAmount;
    } catch (err) {
      return createError({
        type: "API_ERROR",
        message: "Failed to fetch FX rate for currency conversion",
        retryable: true,
        context: { step: "getUsdKrwRate" },
        originalError: err instanceof Error ? err : undefined,
      });
    }
  }

  const pnl = calculatePnL(
    pastPrice,
    currentPrice,
    virtualAmountInStock,
    stock.currency
  );

  // If we converted, also expose the user-display version of `absolute`.
  let pnlForDisplay = pnl;
  if (
    fxRate !== null &&
    pnl.absolute !== null &&
    displayCurrency !== stock.currency
  ) {
    const absoluteInDisplay =
      displayCurrency === "USD" && stock.currency === "KRW"
        ? pnl.absolute / fxRate
        : displayCurrency === "KRW" && stock.currency === "USD"
          ? pnl.absolute * fxRate
          : pnl.absolute;
    pnlForDisplay = {
      ...pnl,
      absolute: absoluteInDisplay,
      currency: displayCurrency,
    };
  }

  // Step 5: Select meme copy based on outcome
  const memeCopy = selectMemeCopy(locale, pnl.outcomeTier);

  // Step 6: Construct result
  const result: CalculationResult = {
    input,
    stock,
    rawBuyDate: buyDate,
    resolvedBuyDate: resolvedDate,
    pastPrice,
    currentPrice,
    pnl: pnlForDisplay,
    memeCopy,
    priceHistory,
    calculatedAt: new Date().toISOString(),
    ...(fxRate !== null && { fxRate, fxRateAt: new Date().toISOString() }),
  } as CalculationResult;

  return createSuccess(result);
}

/**
 * Re-export error types for convenience
 */
export type { YahooFinanceResult, YahooFinanceErrorInfo };

// =============================================================================
// Formatting Re-exports (for backward compatibility)
// =============================================================================

// Re-export formatting utilities from the dedicated format module
// These are kept for backward compatibility - new code should import from @/lib/format
export {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatPrice,
  formatCurrencyWithSign,
  formatCurrencyCompact,
  formatPnL,
  formatDate,
  formatResultDate,
  formatLargeNumber,
  formatShares,
  getCurrencySymbol,
} from "./format";
