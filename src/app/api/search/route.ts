/**
 * Stock Ticker Search API Route
 *
 * GET /api/search?q=<query>
 *
 * Searches for matching KR and US stock tickers using yahoo-finance2.
 * Returns an array of StockSearchResult objects.
 *
 * Caching: Responses are cached via Vercel Data Cache (unstable_cache)
 * with TTL >= 1 hour. Cache status is exposed via x-vercel-cache header.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  searchStocksSafe,
  mapErrorTypeToApiCode,
  mapErrorTypeToStatus,
  type YahooFinanceErrorInfo,
} from "@/lib/yahoo-finance";
import { isKoreanQuery, resolveKoreanQuery } from "@/lib/korean-stock-resolver";
import type { StockSearchResult } from "@/types/stock";

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

/**
 * API response type for successful search
 */
interface SearchSuccessResponse {
  success: true;
  query: string;
  results: StockSearchResult[];
  count: number;
}

/**
 * API response type for error
 */
interface SearchErrorResponse {
  success: false;
  error: string;
  code: string;
  retryable: boolean;
  retryAfterSeconds?: number;
}

type SearchResponse = SearchSuccessResponse | SearchErrorResponse;

/**
 * Minimum query length for search
 */
const MIN_QUERY_LENGTH = 1;

/**
 * Maximum query length to prevent abuse
 */
const MAX_QUERY_LENGTH = 50;

/**
 * GET /api/search
 *
 * Search for stock tickers matching the query.
 *
 * Query Parameters:
 * - q: Search query (required, 1-50 characters)
 *
 * Returns:
 * - 200: Search results found
 * - 400: Invalid query parameter
 * - 500: Server error (retryable)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<SearchResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  // Validate query parameter exists
  if (!query) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required query parameter: q",
        code: "MISSING_QUERY",
        retryable: false,
      },
      { status: 400, headers: createNoCacheHeaders() }
    );
  }

  // Trim and validate query length
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      {
        success: false,
        error: `Query must be at least ${MIN_QUERY_LENGTH} character(s)`,
        code: "QUERY_TOO_SHORT",
        retryable: false,
      },
      { status: 400, headers: createNoCacheHeaders() }
    );
  }

  if (trimmedQuery.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      {
        success: false,
        error: `Query must be at most ${MAX_QUERY_LENGTH} characters`,
        code: "QUERY_TOO_LONG",
        retryable: false,
      },
      { status: 400, headers: createNoCacheHeaders() }
    );
  }

  // Korean queries: Yahoo's search endpoint rejects non-Latin text with 400.
  // Resolve via Daum (KR ticker directory) and verify with Yahoo quote.
  if (isKoreanQuery(trimmedQuery)) {
    try {
      const koResults = await resolveKoreanQuery(trimmedQuery);
      return NextResponse.json(
        {
          success: true,
          query: trimmedQuery,
          results: koResults,
          count: koResults.length,
        },
        { headers: createCacheHeaders() }
      );
    } catch (err) {
      console.error("Korean resolver error:", err);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to search Korean stocks. Please try again.",
          code: "KOREAN_RESOLVER_FAILED",
          retryable: true,
        },
        { status: 502, headers: createNoCacheHeaders() }
      );
    }
  }

  // Use safe wrapper that returns Result type instead of throwing
  const result = await searchStocksSafe(trimmedQuery);

  if (result.success) {
    // Return success response with cache headers
    // Vercel will expose cache status via x-vercel-cache header
    return NextResponse.json(
      {
        success: true,
        query: trimmedQuery,
        results: result.data,
        count: result.data.length,
      },
      { headers: createCacheHeaders() }
    );
  }

  // Handle error gracefully using structured error info
  const errorInfo = result.error;
  console.error("Search API error:", {
    type: errorInfo.type,
    message: errorInfo.message,
    context: errorInfo.context,
  });

  return createErrorResponse(errorInfo);
}

/**
 * Create a standardized error response from YahooFinanceErrorInfo
 */
function createErrorResponse(
  errorInfo: YahooFinanceErrorInfo
): NextResponse<SearchErrorResponse> {
  const userMessage = getUserFriendlyMessage(errorInfo);
  const statusCode = mapErrorTypeToStatus(errorInfo.type);
  const errorCode = mapErrorTypeToApiCode(errorInfo.type);

  return NextResponse.json(
    {
      success: false,
      error: userMessage,
      code: errorCode,
      retryable: errorInfo.retryable,
      ...(errorInfo.retryable && errorInfo.retryAfterSeconds
        ? { retryAfterSeconds: errorInfo.retryAfterSeconds }
        : {}),
    },
    {
      status: statusCode,
      headers: createNoCacheHeaders(),
    }
  );
}

/**
 * Get user-friendly error message based on error type
 */
function getUserFriendlyMessage(errorInfo: YahooFinanceErrorInfo): string {
  switch (errorInfo.type) {
    case "RATE_LIMIT_ERROR":
      return "Too many requests. Please wait a moment and try again.";
    case "NETWORK_ERROR":
      return "Unable to connect to stock data service. Please check your connection and try again.";
    case "TIMEOUT_ERROR":
      return "Request timed out. Please try again.";
    case "NOT_FOUND_ERROR":
      return "No matching stocks found for your search.";
    case "INVALID_DATA_ERROR":
      return "Received invalid data from stock service. Please try again.";
    case "API_ERROR":
    case "UNKNOWN_ERROR":
    default:
      return "Failed to search stocks. Please try again.";
  }
}
