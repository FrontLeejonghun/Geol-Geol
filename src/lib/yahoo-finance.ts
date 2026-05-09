/**
 * Yahoo Finance API Integration
 *
 * Wraps yahoo-finance2 npm package for server-side usage with
 * Vercel Data Cache via unstable_cache for TTL >= 1h.
 *
 * Error Handling Strategy:
 * - Service layer functions return Result<T> types for graceful handling
 * - Cached functions still throw for cache invalidation purposes
 * - All errors are classified and include retry indicators
 * - No unhandled exceptions escape from the service layer
 */

import { unstable_cache } from "next/cache";
import YahooFinance from "yahoo-finance2";
import {
  fetchKoreanCompanyName,
  fetchForeignStockI18n,
  getKoreanStockLogoUrl,
} from "./korean-stock-resolver";
import { translateIndustry } from "./industry-i18n";

const yahooFinance = new YahooFinance();

/**
 * Latest USD→KRW rate from Yahoo (`KRW=X`). Cached 1h.
 */
export const getUsdKrwRate = unstable_cache(
  async (): Promise<number> => {
    const q = await yahooFinance.quote("KRW=X");
    const rate = q?.regularMarketPrice ?? q?.regularMarketPreviousClose;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      throw new YahooFinanceError("Invalid USD/KRW rate");
    }
    return rate;
  },
  ["fx-usd-krw-cached"],
  { revalidate: 3600, tags: ["fx"] }
);

async function fetchYahooIndustry(ticker: string): Promise<string | undefined> {
  try {
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ["assetProfile"],
    });
    return summary.assetProfile?.industry ?? summary.assetProfile?.sector;
  } catch {
    return undefined;
  }
}
import type {
  Stock,
  StockSearchResult,
  PriceHistory,
  PricePoint,
  ExchangeCode,
} from "@/types/stock";
import {
  getMarketFromExchange,
  getCurrencyForMarket,
  getMarketHours,
} from "@/types/stock";

// =============================================================================
// Cache Configuration
// =============================================================================

const CACHE_TTL_SECONDS = 3600; // 1 hour minimum as per requirements

// =============================================================================
// Error Types
// =============================================================================

/**
 * Error category for classification and handling
 */
export type YahooFinanceErrorType =
  | "NETWORK_ERROR" // Connection failed, DNS resolution, etc.
  | "TIMEOUT_ERROR" // Request timed out
  | "RATE_LIMIT_ERROR" // Too many requests (429)
  | "NOT_FOUND_ERROR" // Ticker not found or no data available
  | "INVALID_DATA_ERROR" // Response data is malformed
  | "VALIDATION_ERROR" // Input validation failed
  | "API_ERROR" // Yahoo Finance API returned an error
  | "UNKNOWN_ERROR"; // Unexpected error

/**
 * Structured error response from Yahoo Finance service
 */
export interface YahooFinanceErrorInfo {
  /** Error type for programmatic handling */
  type: YahooFinanceErrorType;
  /** Human-readable error message */
  message: string;
  /** Whether the request can be retried */
  retryable: boolean;
  /** Suggested retry delay in seconds (only if retryable) */
  retryAfterSeconds?: number;
  /** Original error for debugging (not exposed to clients) */
  originalError?: Error;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Result type for graceful error handling without exceptions
 */
export type YahooFinanceResult<T> =
  | { success: true; data: T }
  | { success: false; error: YahooFinanceErrorInfo };

/**
 * Create a success result
 */
export function createSuccess<T>(data: T): YahooFinanceResult<T> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function createError<T>(
  error: YahooFinanceErrorInfo
): YahooFinanceResult<T> {
  return { success: false, error };
}

// =============================================================================
// Search Functions
// =============================================================================

/**
 * Search for stocks by query string
 * Cached for 1 hour
 */
export const searchStocks = unstable_cache(
  async (query: string): Promise<StockSearchResult[]> => {
    try {
      const result = await yahooFinance.search(query, {
        quotesCount: 10,
        newsCount: 0,
      });

      if (!result.quotes || result.quotes.length === 0) {
        return [];
      }

      const stockResults: StockSearchResult[] = [];

      for (const quote of result.quotes) {
        // Filter for equity quotes with Yahoo Finance data
        if (!("isYahooFinance" in quote) || !quote.isYahooFinance) {
          continue;
        }

        // Only include EQUITY type (yahoo-finance2 v3 lowercases typeDisp)
        if (
          !("typeDisp" in quote) ||
          typeof quote.typeDisp !== "string" ||
          quote.typeDisp.toLowerCase() !== "equity"
        ) {
          continue;
        }

        // Type narrow to equity quote
        if (!("symbol" in quote) || typeof quote.symbol !== "string") {
          continue;
        }

        const exchange = (
          "exchange" in quote ? quote.exchange : "UNKNOWN"
        ) as ExchangeCode;
        const market = getMarketFromExchange(exchange);
        const shortName = "shortname" in quote ? quote.shortname : undefined;
        const longName = "longname" in quote ? quote.longname : undefined;

        stockResults.push({
          symbol: quote.symbol,
          name: longName ?? shortName ?? quote.symbol,
          displayName: shortName ?? longName ?? quote.symbol,
          exchange,
          market,
          quoteType: "EQUITY",
        });
      }

      // Enrich with logos and current prices in parallel (best-effort).
      const symbols = stockResults.map((r) => r.symbol);
      const [priceQuotes, enriched] = await Promise.all([
        symbols.length > 0
          ? yahooFinance
              .quote(symbols, { return: "array" })
              .catch(() => [] as Array<{ symbol?: string; regularMarketPrice?: number; regularMarketPreviousClose?: number }>)
          : Promise.resolve([] as Array<{ symbol?: string; regularMarketPrice?: number; regularMarketPreviousClose?: number }>),
        Promise.all(
          stockResults.map(async (r) => {
            try {
              if (r.market === "KR") {
                return { ...r, logoUrl: getKoreanStockLogoUrl(r.symbol) };
              }
              const i18n = await fetchForeignStockI18n(r.symbol, r.exchange);
              return { ...r, logoUrl: i18n.logoUrl };
            } catch {
              return r;
            }
          })
        ),
      ]);

      const priceBySymbol = new Map<string, number>();
      for (const q of priceQuotes) {
        if (q?.symbol) {
          const p = q.regularMarketPrice ?? q.regularMarketPreviousClose;
          if (typeof p === "number") priceBySymbol.set(q.symbol, p);
        }
      }

      return enriched.map((r) => ({
        ...r,
        currency: getCurrencyForMarket(r.market),
        currentPrice: priceBySymbol.get(r.symbol),
      }));
    } catch (error) {
      console.error("Yahoo Finance search error:", error);
      throw new YahooFinanceError(
        "Failed to search stocks",
        error instanceof Error ? error : undefined
      );
    }
  },
  ["yahoo-search"],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: ["yahoo-finance", "search"],
  }
);

// =============================================================================
// Quote Functions
// =============================================================================

/**
 * Get current quote for a ticker
 * Cached for 1 hour
 */
export const getQuote = unstable_cache(
  async (ticker: string): Promise<Stock & { currentPrice: number }> => {
    try {
      const quote = await yahooFinance.quote(ticker);

      if (!quote || !quote.symbol) {
        throw new YahooFinanceError(`No quote found for ticker: ${ticker}`);
      }

      const exchange = (quote.exchange ?? "UNKNOWN") as ExchangeCode;
      const market = getMarketFromExchange(exchange);
      const currency = getCurrencyForMarket(market);

      const currentPrice =
        quote.regularMarketPrice ?? quote.regularMarketPreviousClose ?? 0;

      const nameEn = quote.longName ?? quote.shortName;

      // Run i18n enrichments in parallel — all failures are silent.
      const emptyI18n: {
        nameKo?: string;
        industryKo?: string;
        logoUrl?: string;
      } = {};
      const [nameKoFromKr, foreignI18n, industryEn] = await Promise.all([
        market === "KR"
          ? fetchKoreanCompanyName(quote.symbol).catch(() => null)
          : Promise.resolve(null),
        market === "US"
          ? fetchForeignStockI18n(quote.symbol, exchange).catch(() => emptyI18n)
          : Promise.resolve(emptyI18n),
        fetchYahooIndustry(quote.symbol),
      ]);

      const nameKo = nameKoFromKr ?? foreignI18n.nameKo ?? undefined;
      const industry = industryEn;
      const industryKo =
        foreignI18n.industryKo ?? translateIndustry(industryEn);
      const logoUrl =
        market === "KR"
          ? getKoreanStockLogoUrl(quote.symbol)
          : foreignI18n.logoUrl;

      return {
        ticker: quote.symbol,
        name: nameKo ?? nameEn ?? quote.symbol,
        nameEn,
        nameKo,
        exchange,
        market,
        currency,
        marketHours: getMarketHours(exchange),
        currentPrice,
        industry,
        industryKo,
        logoUrl,
      };
    } catch (error) {
      if (error instanceof YahooFinanceError) throw error;
      console.error("Yahoo Finance quote error:", error);
      throw new YahooFinanceError(
        `Failed to fetch quote for ${ticker}`,
        error instanceof Error ? error : undefined
      );
    }
  },
  ["yahoo-quote"],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: ["yahoo-finance", "quote"],
  }
);

// =============================================================================
// Historical Data Functions
// =============================================================================

/**
 * Get historical price data for a ticker
 * Cached for 1 hour
 *
 * @param ticker - Stock ticker symbol
 * @param startDate - Start date in ISO format (YYYY-MM-DD)
 * @param endDate - End date in ISO format (YYYY-MM-DD), defaults to today
 */
export const getHistoricalPrices = unstable_cache(
  async (
    ticker: string,
    startDate: string,
    endDate?: string
  ): Promise<PriceHistory> => {
    try {
      const end = endDate ?? new Date().toISOString().split("T")[0];

      if (!end) {
        throw new YahooFinanceError("Failed to determine end date");
      }

      const historical = await yahooFinance.historical(ticker, {
        period1: startDate,
        period2: end,
        interval: "1d",
      });

      if (!historical || historical.length === 0) {
        throw new YahooFinanceError(
          `No historical data found for ${ticker} from ${startDate} to ${end}`
        );
      }

      // Get stock info for currency
      const quote = await getQuote(ticker);

      const data: PricePoint[] = historical
        .filter((item) => item.adjClose != null || item.close != null)
        .map((item) => {
          const dateStr = item.date.toISOString().split("T")[0];
          if (!dateStr) {
            throw new YahooFinanceError("Invalid date in historical data");
          }
          return {
            date: dateStr,
            close: (item.adjClose ?? item.close) as number,
            volume: item.volume ?? undefined,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      if (data.length === 0) {
        throw new YahooFinanceError(
          `No valid price data for ${ticker} in the requested range`
        );
      }

      const firstData = data[0];
      const lastData = data[data.length - 1];

      if (!firstData || !lastData) {
        throw new YahooFinanceError("Empty price data array");
      }

      return {
        ticker,
        currency: quote.currency,
        data,
        startDate: firstData.date,
        endDate: lastData.date,
      };
    } catch (error) {
      if (error instanceof YahooFinanceError) throw error;
      console.error("Yahoo Finance historical error:", error);
      throw new YahooFinanceError(
        `Failed to fetch historical data for ${ticker}`,
        error instanceof Error ? error : undefined
      );
    }
  },
  ["yahoo-historical"],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: ["yahoo-finance", "historical"],
  }
);

/**
 * Get the nearest prior trading day's price
 * If the requested date is a weekend/holiday, finds the previous trading day
 *
 * @param ticker - Stock ticker symbol
 * @param date - Requested date in ISO format (YYYY-MM-DD)
 * @returns Object with resolved date and price
 */
export const getPriceOnDate = unstable_cache(
  async (
    ticker: string,
    date: string
  ): Promise<{ resolvedDate: string; price: number }> => {
    try {
      // Step A: usual nearest-prior-trading-day lookup (7-day lookback).
      const lookbackDays = 7;
      const startDate = new Date(date);
      startDate.setDate(startDate.getDate() - lookbackDays);
      const startDateStr = startDate.toISOString().split("T")[0];
      if (!startDateStr) {
        throw new YahooFinanceError("Failed to calculate start date");
      }

      const targetDate = new Date(date);

      try {
        const history = await getHistoricalPrices(ticker, startDateStr, date);
        const validPrices = history.data.filter(
          (p) => new Date(p.date) <= targetDate
        );
        if (validPrices.length > 0) {
          const pricePoint = validPrices[validPrices.length - 1]!;
          return { resolvedDate: pricePoint.date, price: pricePoint.close };
        }
      } catch {
        // fall through to forward-search
      }

      // Step B: requested date is likely before IPO. Fetch from the
      // requested date through today and pick the first trading day that
      // actually has data — that's the IPO date for this ticker.
      const todayStr = new Date().toISOString().split("T")[0]!;
      const forwardRows = await yahooFinance.historical(ticker, {
        period1: date,
        period2: todayStr,
        interval: "1d",
      });
      const firstAvailable = forwardRows?.find(
        (r) => r.date && r.adjClose != null
      );
      if (firstAvailable && firstAvailable.date) {
        const iso = new Date(firstAvailable.date).toISOString().split("T")[0]!;
        return {
          resolvedDate: iso,
          price: firstAvailable.adjClose ?? firstAvailable.close ?? 0,
        };
      }

      throw new YahooFinanceError(
        `No trading data found for ${ticker} near ${date}`
      );
    } catch (error) {
      if (error instanceof YahooFinanceError) throw error;
      console.error("Yahoo Finance getPriceOnDate error:", error);
      throw new YahooFinanceError(
        `Failed to get price for ${ticker} on ${date}`,
        error instanceof Error ? error : undefined
      );
    }
  },
  ["yahoo-price-on-date-v2"],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: ["yahoo-finance", "price-on-date"],
  }
);

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Custom error class for Yahoo Finance API errors
 */
export class YahooFinanceError extends Error {
  public readonly cause?: Error;
  public readonly isRateLimited: boolean;
  public readonly errorType: YahooFinanceErrorType;
  public readonly retryable: boolean;
  public readonly retryAfterSeconds?: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    cause?: Error,
    options?: {
      type?: YahooFinanceErrorType;
      retryAfterSeconds?: number;
      context?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = "YahooFinanceError";
    this.cause = cause;

    // Classify the error
    this.errorType = options?.type ?? classifyError(message, cause);
    this.isRateLimited = this.errorType === "RATE_LIMIT_ERROR";
    this.retryable = isRetryableErrorType(this.errorType);
    this.retryAfterSeconds = options?.retryAfterSeconds ?? getDefaultRetryDelay(this.errorType);
    this.context = options?.context;
  }

  /**
   * Convert to structured error info for API responses
   */
  toErrorInfo(): YahooFinanceErrorInfo {
    return {
      type: this.errorType,
      message: this.message,
      retryable: this.retryable,
      retryAfterSeconds: this.retryable ? this.retryAfterSeconds : undefined,
      originalError: this.cause,
      context: this.context,
    };
  }
}

/**
 * Error patterns for classification
 */
const ERROR_PATTERNS = {
  rateLimitPatterns: [
    "too many requests",
    "429",
    "rate limit",
    "throttle",
    "quota exceeded",
  ],
  networkPatterns: [
    "network",
    "econnrefused",
    "enotfound",
    "econnreset",
    "socket hang up",
    "dns",
    "getaddrinfo",
    "fetch failed",
  ],
  timeoutPatterns: [
    "timeout",
    "etimedout",
    "timed out",
    "deadline exceeded",
    "aborted",
  ],
  notFoundPatterns: [
    "not found",
    "no quote found",
    "no historical data",
    "no valid price",
    "no trading day",
    "symbol not found",
    "404",
  ],
  invalidDataPatterns: [
    "invalid",
    "malformed",
    "unexpected response",
    "parse error",
    "json",
  ],
} as const;

/**
 * Classify an error based on message patterns
 */
function classifyError(
  message: string,
  cause?: Error
): YahooFinanceErrorType {
  const lowerMessage = message.toLowerCase();
  const causeMessage = cause?.message?.toLowerCase() ?? "";
  const combinedMessage = `${lowerMessage} ${causeMessage}`;

  // Check patterns in priority order
  if (matchesPatterns(combinedMessage, ERROR_PATTERNS.rateLimitPatterns)) {
    return "RATE_LIMIT_ERROR";
  }
  if (matchesPatterns(combinedMessage, ERROR_PATTERNS.timeoutPatterns)) {
    return "TIMEOUT_ERROR";
  }
  if (matchesPatterns(combinedMessage, ERROR_PATTERNS.networkPatterns)) {
    return "NETWORK_ERROR";
  }
  if (matchesPatterns(combinedMessage, ERROR_PATTERNS.notFoundPatterns)) {
    return "NOT_FOUND_ERROR";
  }
  if (matchesPatterns(combinedMessage, ERROR_PATTERNS.invalidDataPatterns)) {
    return "INVALID_DATA_ERROR";
  }

  // Check if it's a known API error (non-2xx response)
  if (cause?.name === "HTTPError" || combinedMessage.includes("http error")) {
    return "API_ERROR";
  }

  return "UNKNOWN_ERROR";
}

/**
 * Check if message matches any of the patterns
 */
function matchesPatterns(message: string, patterns: readonly string[]): boolean {
  return patterns.some(pattern => message.includes(pattern));
}

/**
 * Determine if an error type is retryable
 */
function isRetryableErrorType(type: YahooFinanceErrorType): boolean {
  const retryableTypes: YahooFinanceErrorType[] = [
    "NETWORK_ERROR",
    "TIMEOUT_ERROR",
    "RATE_LIMIT_ERROR",
    "API_ERROR",
    "UNKNOWN_ERROR",
  ];
  return retryableTypes.includes(type);
}

/**
 * Get default retry delay for an error type (in seconds)
 */
function getDefaultRetryDelay(type: YahooFinanceErrorType): number {
  switch (type) {
    case "RATE_LIMIT_ERROR":
      return 60; // Wait longer for rate limits
    case "TIMEOUT_ERROR":
      return 5;
    case "NETWORK_ERROR":
      return 10;
    case "API_ERROR":
      return 15;
    default:
      return 30;
  }
}

/**
 * Check if an error message indicates rate limiting
 */
function isRateLimitError(message: string): boolean {
  return matchesPatterns(
    message.toLowerCase(),
    ERROR_PATTERNS.rateLimitPatterns
  );
}

/**
 * Type guard for YahooFinanceError
 */
export function isYahooFinanceError(
  error: unknown
): error is YahooFinanceError {
  return error instanceof YahooFinanceError;
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitedError(error: unknown): boolean {
  if (error instanceof YahooFinanceError) {
    return error.isRateLimited;
  }
  if (error instanceof Error) {
    return isRateLimitError(error.message);
  }
  return false;
}

/**
 * Check if an error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof YahooFinanceError) {
    return error.errorType === "NOT_FOUND_ERROR";
  }
  if (error instanceof Error) {
    return matchesPatterns(
      error.message.toLowerCase(),
      ERROR_PATTERNS.notFoundPatterns
    );
  }
  return false;
}

/**
 * Check if an error is a network/connectivity error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof YahooFinanceError) {
    return error.errorType === "NETWORK_ERROR" || error.errorType === "TIMEOUT_ERROR";
  }
  if (error instanceof Error) {
    const lowerMessage = error.message.toLowerCase();
    return (
      matchesPatterns(lowerMessage, ERROR_PATTERNS.networkPatterns) ||
      matchesPatterns(lowerMessage, ERROR_PATTERNS.timeoutPatterns)
    );
  }
  return false;
}

/**
 * Convert any error to a YahooFinanceError
 */
export function toYahooFinanceError(
  error: unknown,
  fallbackMessage: string = "An unexpected error occurred"
): YahooFinanceError {
  if (error instanceof YahooFinanceError) {
    return error;
  }
  if (error instanceof Error) {
    return new YahooFinanceError(error.message || fallbackMessage, error);
  }
  return new YahooFinanceError(fallbackMessage);
}

/**
 * Convert any error to structured error info
 */
export function toErrorInfo(
  error: unknown,
  fallbackMessage: string = "An unexpected error occurred"
): YahooFinanceErrorInfo {
  const yahooError = toYahooFinanceError(error, fallbackMessage);
  return yahooError.toErrorInfo();
}

/**
 * Wrap an async function with graceful error handling
 * Returns a Result type instead of throwing
 */
export async function withGracefulErrors<T>(
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<YahooFinanceResult<T>> {
  try {
    const data = await fn();
    return createSuccess(data);
  } catch (error) {
    const errorInfo = toErrorInfo(error);
    if (context) {
      errorInfo.context = { ...errorInfo.context, ...context };
    }
    return createError(errorInfo);
  }
}

// =============================================================================
// Safe API Functions (Return Result types instead of throwing)
// =============================================================================

/**
 * Search for stocks by query string - safe version
 * Returns Result type instead of throwing exceptions
 */
export async function searchStocksSafe(
  query: string
): Promise<YahooFinanceResult<StockSearchResult[]>> {
  return withGracefulErrors(
    () => searchStocks(query),
    { operation: "search", query }
  );
}

/**
 * Get current quote for a ticker - safe version
 * Returns Result type instead of throwing exceptions
 */
export async function getQuoteSafe(
  ticker: string
): Promise<YahooFinanceResult<Stock & { currentPrice: number }>> {
  return withGracefulErrors(
    () => getQuote(ticker),
    { operation: "quote", ticker }
  );
}

/**
 * Get historical price data for a ticker - safe version
 * Returns Result type instead of throwing exceptions
 */
export async function getHistoricalPricesSafe(
  ticker: string,
  startDate: string,
  endDate?: string
): Promise<YahooFinanceResult<PriceHistory>> {
  return withGracefulErrors(
    () => getHistoricalPrices(ticker, startDate, endDate),
    { operation: "historical", ticker, startDate, endDate }
  );
}

/**
 * Get the nearest prior trading day's price - safe version
 * Returns Result type instead of throwing exceptions
 */
export async function getPriceOnDateSafe(
  ticker: string,
  date: string
): Promise<YahooFinanceResult<{ resolvedDate: string; price: number }>> {
  return withGracefulErrors(
    () => getPriceOnDate(ticker, date),
    { operation: "priceOnDate", ticker, date }
  );
}

/**
 * Map YahooFinanceErrorInfo to API error code
 * Used by API routes to convert service errors to HTTP responses
 */
export function mapErrorTypeToApiCode(
  errorType: YahooFinanceErrorType
): string {
  switch (errorType) {
    case "RATE_LIMIT_ERROR":
      return "RATE_LIMITED";
    case "NOT_FOUND_ERROR":
      return "TICKER_NOT_FOUND";
    case "NETWORK_ERROR":
    case "TIMEOUT_ERROR":
    case "API_ERROR":
      return "EXTERNAL_API_ERROR";
    case "VALIDATION_ERROR":
    case "INVALID_DATA_ERROR":
      return "INVALID_REQUEST";
    default:
      return "INTERNAL_ERROR";
  }
}

/**
 * Map YahooFinanceErrorInfo to HTTP status code
 * Used by API routes to determine response status
 */
export function mapErrorTypeToStatus(
  errorType: YahooFinanceErrorType
): number {
  switch (errorType) {
    case "RATE_LIMIT_ERROR":
      return 429;
    case "NOT_FOUND_ERROR":
      return 404;
    case "VALIDATION_ERROR":
    case "INVALID_DATA_ERROR":
      return 400;
    case "NETWORK_ERROR":
    case "TIMEOUT_ERROR":
    case "API_ERROR":
    case "UNKNOWN_ERROR":
    default:
      return 500;
  }
}
