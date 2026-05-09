/**
 * Stock Quote & Calculation API Route
 *
 * GET /api/quote?ticker=<ticker>&buyDate=<date>&virtualAmount=<amount>&locale=<locale>
 *
 * Fetches historical and current prices for a stock, calculates P&L,
 * and returns a complete calculation result including meme copy.
 *
 * Caching: Responses are cached via Vercel Data Cache (unstable_cache)
 * with TTL >= 1 hour. Cache status is exposed via x-vercel-cache header.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  calculateStockRegretSafe,
  type YahooFinanceErrorInfo,
} from "@/lib/calculation";
import {
  mapErrorTypeToStatus,
} from "@/lib/yahoo-finance";
import type {
  Locale,
  CalculationResult,
  ApiResponse,
  ApiErrorCode,
} from "@/types/stock";
import { API_ERROR_CODES, createApiError } from "@/types/stock";

// =============================================================================
// Cache Configuration
// =============================================================================

/**
 * Cache TTL in seconds (1 hour)
 * This matches the unstable_cache TTL for yahoo-finance data
 */
const CACHE_TTL_SECONDS = 3600;

/**
 * Create response headers with cache control
 * Enables Vercel CDN caching with the x-vercel-cache header for verification
 */
function createCacheHeaders(): Headers {
  const headers = new Headers();
  // s-maxage: CDN cache time (Vercel edge)
  // stale-while-revalidate: serve stale while revalidating in background
  headers.set(
    "Cache-Control",
    `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${CACHE_TTL_SECONDS * 2}`
  );
  return headers;
}

/**
 * Create no-cache headers for error responses
 */
function createNoCacheHeaders(): Headers {
  const headers = new Headers();
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return headers;
}

// =============================================================================
// Types
// =============================================================================

type QuoteApiResponse = ApiResponse<CalculationResult>;

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate ticker symbol format
 * Allows alphanumeric, dots (for .KS, .KQ), and dashes
 */
function isValidTicker(ticker: string): boolean {
  // Allow format like: AAPL, 005930.KS, TSLA, BRK-B
  const tickerRegex = /^[A-Z0-9]([A-Z0-9.-]{0,18}[A-Z0-9])?$/i;
  return tickerRegex.test(ticker);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsed = new Date(date + "T00:00:00");
  return !isNaN(parsed.getTime());
}

/**
 * Check if date is in the future
 */
function isFutureDate(date: string): boolean {
  const inputDate = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate > today;
}

/**
 * Check if date is today
 */
function isToday(date: string): boolean {
  const inputDate = new Date(date + "T00:00:00");
  const today = new Date();
  return (
    inputDate.getFullYear() === today.getFullYear() &&
    inputDate.getMonth() === today.getMonth() &&
    inputDate.getDate() === today.getDate()
  );
}

/**
 * Validate locale parameter
 */
function isValidLocale(locale: string): locale is Locale {
  return locale === "ko" || locale === "en";
}

// =============================================================================
// API Handler
// =============================================================================

/**
 * GET /api/quote
 *
 * Calculate stock regret based on past purchase date.
 *
 * Query Parameters:
 * - ticker: Stock symbol (required, e.g., "AAPL", "005930.KS")
 * - buyDate: Past purchase date (required, YYYY-MM-DD format)
 * - virtualAmount: Hypothetical purchase amount (optional, positive number)
 * - locale: Locale for meme copy (optional, defaults to "ko")
 *
 * Returns:
 * - 200: Calculation result
 * - 400: Invalid parameters
 * - 404: Ticker not found or no data available
 * - 500: Server error (retryable)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<QuoteApiResponse>> {
  const searchParams = request.nextUrl.searchParams;

  // Extract parameters
  const ticker = searchParams.get("ticker");
  const buyDate = searchParams.get("buyDate");
  const virtualAmountStr = searchParams.get("virtualAmount");
  const localeParam = searchParams.get("locale") ?? "ko";

  // ==========================================================================
  // Validate required parameters
  // ==========================================================================

  // Validate ticker
  if (!ticker) {
    return NextResponse.json(
      {
        success: false,
        error: createApiError(
          API_ERROR_CODES.INVALID_REQUEST,
          "Missing required parameter: ticker"
        ),
      },
      { status: 400, headers: createNoCacheHeaders() }
    );
  }

  const trimmedTicker = ticker.trim().toUpperCase();
  if (!isValidTicker(trimmedTicker)) {
    return NextResponse.json(
      {
        success: false,
        error: createApiError(
          API_ERROR_CODES.INVALID_REQUEST,
          "Invalid ticker format",
          { ticker: trimmedTicker }
        ),
      },
      { status: 400, headers: createNoCacheHeaders() }
    );
  }

  // Validate buyDate
  if (!buyDate) {
    return NextResponse.json(
      {
        success: false,
        error: createApiError(
          API_ERROR_CODES.INVALID_REQUEST,
          "Missing required parameter: buyDate"
        ),
      },
      { status: 400, headers: createNoCacheHeaders() }
    );
  }

  if (!isValidDateFormat(buyDate)) {
    return NextResponse.json(
      {
        success: false,
        error: createApiError(
          API_ERROR_CODES.INVALID_DATE,
          "Invalid date format. Expected: YYYY-MM-DD",
          { buyDate }
        ),
      },
      { status: 400, headers: createNoCacheHeaders() }
    );
  }

  if (isFutureDate(buyDate)) {
    return NextResponse.json(
      {
        success: false,
        error: createApiError(
          API_ERROR_CODES.FUTURE_DATE,
          "Buy date cannot be in the future",
          { buyDate }
        ),
      },
      { status: 400, headers: createNoCacheHeaders() }
    );
  }

  if (isToday(buyDate)) {
    return NextResponse.json(
      {
        success: false,
        error: createApiError(
          API_ERROR_CODES.INVALID_DATE,
          "Buy date must be in the past, not today",
          { buyDate }
        ),
      },
      { status: 400, headers: createNoCacheHeaders() }
    );
  }

  // ==========================================================================
  // Validate optional parameters
  // ==========================================================================

  // Validate virtualAmount if provided
  let virtualAmount: number | undefined;
  if (virtualAmountStr) {
    const parsed = parseFloat(virtualAmountStr);
    if (isNaN(parsed) || parsed <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: createApiError(
            API_ERROR_CODES.INVALID_REQUEST,
            "virtualAmount must be a positive number",
            { virtualAmount: virtualAmountStr }
          ),
        },
        { status: 400, headers: createNoCacheHeaders() }
      );
    }
    virtualAmount = parsed;
  }

  // Validate locale
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ko";

  // ==========================================================================
  // Execute calculation using safe wrapper
  // ==========================================================================

  const result = await calculateStockRegretSafe(
    {
      ticker: trimmedTicker,
      buyDate,
      virtualAmount,
    },
    locale
  );

  if (result.success) {
    // Return success response with cache headers
    // Vercel will expose cache status via x-vercel-cache header
    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      {
        headers: createCacheHeaders(),
      }
    );
  }

  // Handle error gracefully using structured error info
  return createQuoteErrorResponse(result.error, trimmedTicker, buyDate);
}

/**
 * Create a standardized error response from YahooFinanceErrorInfo
 */
function createQuoteErrorResponse(
  errorInfo: YahooFinanceErrorInfo,
  ticker: string,
  buyDate: string
): NextResponse<QuoteApiResponse> {
  // Log error with context (excluding originalError for production)
  console.error("Quote API error:", {
    type: errorInfo.type,
    message: errorInfo.message,
    context: errorInfo.context,
    ticker,
    buyDate,
  });

  const userMessage = getQuoteUserFriendlyMessage(errorInfo, ticker);
  const statusCode = mapErrorTypeToStatus(errorInfo.type);
  const errorCode = getQuoteErrorCode(errorInfo.type);

  const details: Record<string, unknown> = {
    retryable: errorInfo.retryable,
  };

  // Add retry delay for retryable errors
  if (errorInfo.retryable && errorInfo.retryAfterSeconds) {
    details.retryAfterSeconds = errorInfo.retryAfterSeconds;
  }

  // Add ticker context for not-found errors
  if (errorInfo.type === "NOT_FOUND_ERROR") {
    details.ticker = ticker;
    details.buyDate = buyDate;
  }

  return NextResponse.json(
    {
      success: false,
      error: createApiError(errorCode, userMessage, details),
    },
    {
      status: statusCode,
      headers: createNoCacheHeaders(),
    }
  );
}

/**
 * Get user-friendly error message based on error type for quote API
 */
function getQuoteUserFriendlyMessage(
  errorInfo: YahooFinanceErrorInfo,
  ticker: string
): string {
  switch (errorInfo.type) {
    case "RATE_LIMIT_ERROR":
      return "Too many requests. Please wait a moment and try again.";
    case "NETWORK_ERROR":
      return "Unable to connect to stock data service. Please check your connection and try again.";
    case "TIMEOUT_ERROR":
      return "Request timed out while fetching stock data. Please try again.";
    case "NOT_FOUND_ERROR":
      // Check context for more specific error
      if (errorInfo.message.includes("No historical data") ||
          errorInfo.message.includes("No valid price") ||
          errorInfo.message.includes("No trading day")) {
        return "No price data available for the selected date range.";
      }
      return `Stock ticker "${ticker}" not found.`;
    case "INVALID_DATA_ERROR":
      return "Received invalid data from stock service. Please try again.";
    case "API_ERROR":
      return "Failed to fetch stock data. Please try again.";
    case "UNKNOWN_ERROR":
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

/**
 * Get appropriate API error code for quote errors
 */
function getQuoteErrorCode(errorType: string): ApiErrorCode {
  switch (errorType) {
    case "RATE_LIMIT_ERROR":
      return API_ERROR_CODES.RATE_LIMITED;
    case "NOT_FOUND_ERROR":
      return API_ERROR_CODES.TICKER_NOT_FOUND;
    case "NETWORK_ERROR":
    case "TIMEOUT_ERROR":
    case "API_ERROR":
      return API_ERROR_CODES.EXTERNAL_API_ERROR;
    case "INVALID_DATA_ERROR":
      return API_ERROR_CODES.INVALID_REQUEST;
    default:
      return API_ERROR_CODES.INTERNAL_ERROR;
  }
}
