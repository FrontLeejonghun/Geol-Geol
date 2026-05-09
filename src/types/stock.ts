/**
 * GeolGeol Stock Domain Types
 *
 * Domain model for a stock-regret calculator that computes hypothetical
 * gains/losses for KR/US stocks based on a past purchase date.
 */

// =============================================================================
// Locale & Theme Types
// =============================================================================

/**
 * Supported locales for i18n
 */
export type Locale = "ko" | "en";

/**
 * Theme preference
 */
export type Theme = "light" | "dark";

// =============================================================================
// Market & Ticker Types
// =============================================================================

/**
 * Supported market types for stock trading
 */
export type MarketType = "KR" | "US";

/**
 * Currency codes tied to markets
 * - KR market always uses KRW
 * - US market always uses USD
 */
export type StockCurrency = "KRW" | "USD";

/**
 * Exchange identifiers recognized by yahoo-finance2
 */
export type ExchangeCode =
  | "KSC" // KOSPI (Korea Stock Exchange)
  | "KOE" // KOSDAQ
  | "NYQ" // NYSE
  | "NMS" // NASDAQ
  | "ASE" // NYSE American
  | string; // Allow other exchanges

/**
 * Market hours specification for a given exchange
 */
export interface MarketHours {
  /** Exchange timezone (e.g., "Asia/Seoul", "America/New_York") */
  timezone: string;
  /** Market open time in local timezone (e.g., "09:00") */
  openTime: string;
  /** Market close time in local timezone (e.g., "15:30") */
  closeTime: string;
}

// =============================================================================
// Stock Types
// =============================================================================

/**
 * Stock ticker search result from yahoo-finance2 search()
 */
export interface StockSearchResult {
  /** Stock ticker symbol (e.g., "005930.KS", "AAPL") */
  symbol: string;
  /** Stock name in exchange's primary language */
  name: string;
  /** Stock name for i18n display */
  displayName?: string;
  /** Exchange code */
  exchange: ExchangeCode;
  /** Market type derived from exchange */
  market: MarketType;
  /** Stock type (e.g., "EQUITY", "ETF") */
  quoteType?: string;
  /** Square logo URL for the issuer */
  logoUrl?: string;
  /** Latest available close price (in stock's native currency) */
  currentPrice?: number;
  /** Currency code for currentPrice (auto-derived) */
  currency?: StockCurrency;
}

/**
 * Fully resolved stock security after ticker lookup
 * This is the primary stock object used throughout the application
 */
export interface Stock {
  /** Stock ticker symbol (e.g., "005930.KS", "AAPL") */
  ticker: string;

  /** Stock name for display (i18n-aware) */
  name: string;

  /** English name fallback */
  nameEn?: string;

  /** Korean name (if available for KR stocks) */
  nameKo?: string;

  /** Exchange code where stock is listed */
  exchange: ExchangeCode;

  /** Market type (KR or US) */
  market: MarketType;

  /** Currency for this stock (auto-derived from market) */
  currency: StockCurrency;

  /** Market hours for this exchange */
  marketHours: MarketHours;

  /** Industry / business segment in English (e.g. "Consumer Electronics") */
  industry?: string;

  /** Industry / business segment in Korean (e.g. "반도체") */
  industryKo?: string;

  /** Square logo URL (Naver-hosted SVG) */
  logoUrl?: string;
}

// =============================================================================
// Price & History Types
// =============================================================================

/**
 * Single data point in price history
 */
export interface PricePoint {
  /** Date in ISO format (YYYY-MM-DD) */
  date: string;
  /** Adjusted close price in stock's native currency */
  close: number;
  /** Trading volume (optional) */
  volume?: number;
}

/**
 * Price history slice for chart rendering
 */
export interface PriceHistory {
  /** Stock ticker symbol */
  ticker: string;
  /** Currency of prices */
  currency: StockCurrency;
  /** Array of daily price points from buyDate to today */
  data: PricePoint[];
  /** Start date of history (resolved trading day) */
  startDate: string;
  /** End date of history */
  endDate: string;
}

// =============================================================================
// Quote & Price Types
// =============================================================================

/**
 * Stock quote with past and current prices
 */
export interface StockQuote {
  /** Stock ticker symbol */
  ticker: string;
  /** Stock details */
  stock: Stock;
  /** User's selected buy date (ISO format) */
  rawBuyDate: string;
  /** Resolved trading day buy date (ISO format) */
  resolvedBuyDate: string;
  /** Adjusted close price on resolved buy date */
  pastPrice: number;
  /** Latest available close price (15-min delayed acceptable) */
  currentPrice: number;
  /** Price history from buyDate to today */
  priceHistory: PriceHistory;
  /** Quote timestamp */
  quoteTimestamp: string;
}

// =============================================================================
// P&L Types
// =============================================================================

/**
 * Outcome tier based on P&L percentage
 * Used for selecting meme copy and visual styling
 *
 * Thresholds (percentage):
 * - catastrophe: < -50%     (massive loss)
 * - loss:        >= -50% AND < 0%  (moderate loss)
 * - flat:        >= 0% AND < 10%   (negligible gain)
 * - gain:        >= 10% AND < 100% (solid gain)
 * - jackpot:     >= 100%    (life-changing gain)
 */
export type OutcomeTier =
  | "catastrophe" // < -50%
  | "loss" // >= -50% AND < 0%
  | "flat" // >= 0% AND < 10%
  | "gain" // >= 10% AND < 100%
  | "jackpot"; // >= 100%

/**
 * Outcome tier threshold boundaries (percentage values)
 * These define the exclusive upper bounds for each tier (except jackpot)
 */
export const OUTCOME_THRESHOLDS = {
  /** Below this threshold = catastrophe */
  CATASTROPHE_UPPER: -50,
  /** Below this threshold (and >= CATASTROPHE_UPPER) = loss */
  LOSS_UPPER: 0,
  /** Below this threshold (and >= LOSS_UPPER) = flat */
  FLAT_UPPER: 10,
  /** Below this threshold (and >= FLAT_UPPER) = gain; above = jackpot */
  GAIN_UPPER: 100,
} as const;

/**
 * Type for outcome threshold keys
 */
export type OutcomeThresholdKey = keyof typeof OUTCOME_THRESHOLDS;

/**
 * Profit & Loss calculation result
 */
export interface PnL {
  /** Absolute gain/loss in stock's currency (if virtualAmount provided) */
  absolute: number | null;
  /** Percentage gain/loss */
  percent: number;
  /** Currency code for absolute amount */
  currency: StockCurrency;
  /** Outcome tier for meme selection */
  outcomeTier: OutcomeTier;
}

// =============================================================================
// Input Types
// =============================================================================

/**
 * User input for stock calculation
 */
export interface StockCalculationInput {
  /** Stock ticker symbol */
  ticker: string;
  /** Selected buy date (ISO format YYYY-MM-DD) */
  buyDate: string;
  /** Optional hypothetical purchase amount in stock's native currency */
  virtualAmount?: number;
}

// =============================================================================
// Utility Functions for Type Guards
// =============================================================================

/**
 * Check if a market type is Korean
 */
export function isKoreanMarket(market: MarketType): market is "KR" {
  return market === "KR";
}

/**
 * Check if a market type is US
 */
export function isUSMarket(market: MarketType): market is "US" {
  return market === "US";
}

/**
 * Get currency for a market type
 */
export function getCurrencyForMarket(market: MarketType): StockCurrency {
  return market === "KR" ? "KRW" : "USD";
}

/**
 * Derive market type from exchange code
 */
export function getMarketFromExchange(exchange: ExchangeCode): MarketType {
  const krExchanges: ExchangeCode[] = ["KSC", "KOE"];
  return krExchanges.includes(exchange) ? "KR" : "US";
}

/**
 * Get market hours for an exchange
 */
export function getMarketHours(exchange: ExchangeCode): MarketHours {
  const krExchanges: ExchangeCode[] = ["KSC", "KOE"];

  if (krExchanges.includes(exchange)) {
    return {
      timezone: "Asia/Seoul",
      openTime: "09:00",
      closeTime: "15:30",
    };
  }

  // Default to US market hours
  return {
    timezone: "America/New_York",
    openTime: "09:30",
    closeTime: "16:00",
  };
}

/**
 * Calculate outcome tier from P&L percentage
 *
 * Uses the following thresholds:
 * - catastrophe: < -50%
 * - loss:        >= -50% AND < 0%
 * - flat:        >= 0% AND < 10%
 * - gain:        >= 10% AND < 100%
 * - jackpot:     >= 100%
 *
 * @param percentChange - The percentage change in stock price
 * @returns The outcome tier based on the percentage change
 */
export function getOutcomeTier(percentChange: number): OutcomeTier {
  if (percentChange < OUTCOME_THRESHOLDS.CATASTROPHE_UPPER) return "catastrophe";
  if (percentChange < OUTCOME_THRESHOLDS.LOSS_UPPER) return "loss";
  if (percentChange < OUTCOME_THRESHOLDS.FLAT_UPPER) return "flat";
  if (percentChange < OUTCOME_THRESHOLDS.GAIN_UPPER) return "gain";
  return "jackpot";
}

/**
 * Get the threshold boundaries for a given outcome tier
 *
 * @param tier - The outcome tier
 * @returns Object with min (inclusive) and max (exclusive) percentage bounds
 */
export function getOutcomeTierBounds(tier: OutcomeTier): { min: number; max: number } {
  switch (tier) {
    case "catastrophe":
      return { min: -Infinity, max: OUTCOME_THRESHOLDS.CATASTROPHE_UPPER };
    case "loss":
      return { min: OUTCOME_THRESHOLDS.CATASTROPHE_UPPER, max: OUTCOME_THRESHOLDS.LOSS_UPPER };
    case "flat":
      return { min: OUTCOME_THRESHOLDS.LOSS_UPPER, max: OUTCOME_THRESHOLDS.FLAT_UPPER };
    case "gain":
      return { min: OUTCOME_THRESHOLDS.FLAT_UPPER, max: OUTCOME_THRESHOLDS.GAIN_UPPER };
    case "jackpot":
      return { min: OUTCOME_THRESHOLDS.GAIN_UPPER, max: Infinity };
  }
}

/**
 * All possible outcome tiers in order from worst to best
 */
export const OUTCOME_TIER_ORDER: readonly OutcomeTier[] = [
  "catastrophe",
  "loss",
  "flat",
  "gain",
  "jackpot",
] as const;

// =============================================================================
// Meme Copy Types
// =============================================================================

/**
 * Meme copy content for share image and result display
 * Selected based on locale and outcome tier
 */
export interface MemeCopy {
  /** Main headline text (e.g., "그때 살껄...") */
  headline: string;
  /** Secondary subline text (e.g., "지금쯤 부자였을텐데") */
  subline: string;
}

/**
 * Meme copy pool structure keyed by locale and outcome tier
 */
export type MemeCopyPool = {
  [L in Locale]: {
    [T in OutcomeTier]: MemeCopy[];
  };
};

// =============================================================================
// Share Image Types
// =============================================================================

/**
 * Share image size presets
 * - 1080x1350: Instagram portrait (4:5)
 * - 1200x630: Open Graph / Twitter Card
 */
export type ShareImageSize = "1080x1350" | "1200x630";

/**
 * Share image dimensions
 */
export interface ShareImageDimensions {
  width: number;
  height: number;
}

/**
 * Get dimensions for a share image size
 */
export function getShareImageDimensions(
  size: ShareImageSize
): ShareImageDimensions {
  const dimensions: Record<ShareImageSize, ShareImageDimensions> = {
    "1080x1350": { width: 1080, height: 1350 },
    "1200x630": { width: 1200, height: 630 },
  };
  return dimensions[size];
}

/**
 * Share image specification for canvas rendering
 */
export interface ShareImage {
  /** Image size preset */
  size: ShareImageSize;
  /** Generated image as Blob */
  blob: Blob;
  /** Data URL for preview/download */
  dataUrl: string;
}

/**
 * Input data required for share image generation
 */
export interface ShareImageInput {
  /** Stock information */
  stock: Stock;
  /** Buy date (resolved) */
  buyDate: string;
  /** Past price on buy date */
  pastPrice: number;
  /** Current price */
  currentPrice: number;
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

// =============================================================================
// Calculation Result Types
// =============================================================================

/**
 * Complete calculation result combining all outputs
 * This is the main result type returned by the calculate API
 */
export interface CalculationResult {
  /** Input parameters (echoed back) */
  input: StockCalculationInput;

  /** Resolved stock information */
  stock: Stock;

  /** Raw buy date as selected by user */
  rawBuyDate: string;

  /** Resolved buy date (nearest prior trading day) */
  resolvedBuyDate: string;

  /** Adjusted close price on resolved buy date */
  pastPrice: number;

  /** Latest available close price */
  currentPrice: number;

  /** P&L calculation result */
  pnl: PnL;

  /** Selected meme copy for display */
  memeCopy: MemeCopy;

  /** Price history for chart rendering */
  priceHistory: PriceHistory;

  /** Timestamp when calculation was performed */
  calculatedAt: string;
}

// =============================================================================
// API Types
// =============================================================================

/**
 * API error response structure
 */
export interface ApiError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details (optional) */
  details?: Record<string, unknown>;
}

/**
 * Generic API response wrapper
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

/**
 * Quote API request parameters
 */
export interface QuoteApiRequest {
  /** Stock ticker symbol */
  ticker: string;
  /** Buy date in ISO format (YYYY-MM-DD) */
  buyDate: string;
  /** Optional virtual purchase amount */
  virtualAmount?: number;
  /** Locale for formatting */
  locale?: Locale;
}

/**
 * Quote API response data
 */
export type QuoteApiResponse = ApiResponse<CalculationResult>;

/**
 * Search API request parameters
 */
export interface SearchApiRequest {
  /** Search query string */
  query: string;
  /** Maximum number of results */
  limit?: number;
}

/**
 * Search API response data
 */
export type SearchApiResponse = ApiResponse<StockSearchResult[]>;

/**
 * Share image API request parameters
 */
export interface ShareImageApiRequest {
  /** Stock ticker symbol */
  ticker: string;
  /** Buy date in ISO format */
  buyDate: string;
  /** Virtual amount (optional) */
  virtualAmount?: number;
  /** Image size preset */
  size: ShareImageSize;
  /** Theme */
  theme?: Theme;
  /** Locale */
  locale?: Locale;
}

// =============================================================================
// Error Codes
// =============================================================================

/**
 * Standard API error codes
 */
export const API_ERROR_CODES = {
  /** Ticker symbol not found */
  TICKER_NOT_FOUND: "TICKER_NOT_FOUND",
  /** Invalid date format or range */
  INVALID_DATE: "INVALID_DATE",
  /** Date is in the future */
  FUTURE_DATE: "FUTURE_DATE",
  /** No price data available for date range */
  NO_PRICE_DATA: "NO_PRICE_DATA",
  /** External API (Yahoo Finance) error */
  EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
  /** Rate limit exceeded */
  RATE_LIMITED: "RATE_LIMITED",
  /** Invalid request parameters */
  INVALID_REQUEST: "INVALID_REQUEST",
  /** Internal server error */
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

/**
 * Create a standardized API error
 */
export function createApiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiError {
  return { code, message, details };
}
