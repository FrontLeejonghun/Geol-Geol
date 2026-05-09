/**
 * Market Holidays Module
 *
 * Centralized module for market holiday data across supported markets.
 * Supports both KRX (Korean Exchange) and NYSE/NASDAQ (US markets)
 * with pre-computed holiday data.
 *
 * Usage:
 * ```ts
 * import { isKRXHoliday, getKRXHoliday, findNearestPriorKRXTradingDay } from '@/lib/market-holidays';
 * import { isNYSEHoliday, getNYSEHoliday, findNearestPriorNYSETradingDay } from '@/lib/market-holidays';
 * ```
 */

// Export all KRX holiday utilities
export {
  // Core lookup functions
  isKRXHoliday,
  getKRXHoliday,
  getKRXHolidaysForYear,
  getKRXHolidaysInRange,

  // Trading day utilities
  isKRXTradingDay,
  findNearestPriorKRXTradingDay,

  // Data availability
  hasKRXHolidayData,
  getKRXHolidayDataRange,
  getAllKRXHolidayDates,

  // Localized name lookup
  getKRXHolidayName,

  // Market hours
  KRX_MARKET_HOURS,
  KRX_EARLY_CLOSE_TIME,

  // Types
  type KRXHolidayName,
} from "./krx";

// Export all NYSE/NASDAQ holiday utilities
export {
  // Core lookup functions
  isNYSEHoliday,
  getNYSEHoliday,
  getNYSEHolidaysForYear,
  getNYSEHolidaysInRange,

  // Early close day utilities
  isNYSEEarlyClose,
  getNYSEEarlyCloseDaysForYear,
  getAllNYSEEarlyCloseDates,

  // Trading day utilities
  isNYSETradingDay,
  findNearestPriorNYSETradingDay,

  // Data availability
  hasNYSEHolidayData,
  getNYSEHolidayDataRange,
  getAllNYSEHolidayDates,

  // Localized name lookup
  getNYSEHolidayName,

  // Market hours
  NYSE_MARKET_HOURS,
  NYSE_EARLY_CLOSE_TIME,
  NYSE_PRE_MARKET_HOURS,
  NYSE_AFTER_HOURS,

  // Types
  type NYSEHolidayName,
} from "./nyse";

// =============================================================================
// Generic Market Holiday API
// =============================================================================

import type { MarketType } from "@/types/stock";
import type { MarketHoliday } from "@/types/trading-calendar";
import {
  isKRXHoliday,
  getKRXHoliday,
  isKRXTradingDay,
  findNearestPriorKRXTradingDay,
} from "./krx";
import {
  isNYSEHoliday,
  getNYSEHoliday,
  isNYSETradingDay,
  findNearestPriorNYSETradingDay,
} from "./nyse";

/**
 * Check if a date is a market holiday for the given market
 * @param date - Date in YYYY-MM-DD format
 * @param market - Market type (KR or US)
 * @returns true if the date is a holiday for the specified market
 */
export function isMarketHoliday(date: string, market: MarketType): boolean {
  switch (market) {
    case "KR":
      return isKRXHoliday(date);
    case "US":
      return isNYSEHoliday(date);
    default:
      return false;
  }
}

/**
 * Alias for isMarketHoliday for convenience
 * @param date - Date in YYYY-MM-DD format
 * @param market - Market type (KR or US)
 * @returns true if the date is a holiday for the specified market
 */
export function isHoliday(date: string, market: MarketType): boolean {
  return isMarketHoliday(date, market);
}

/**
 * Get holiday information for a specific date and market
 * @param date - Date in YYYY-MM-DD format
 * @param market - Market type (KR or US)
 * @returns MarketHoliday object or null if not a holiday
 */
export function getMarketHoliday(date: string, market: MarketType): MarketHoliday | null {
  switch (market) {
    case "KR":
      return getKRXHoliday(date);
    case "US":
      return getNYSEHoliday(date);
    default:
      return null;
  }
}

/**
 * Check if a date is a trading day for the given market
 * (not a weekend and not a market holiday)
 * @param date - Date in YYYY-MM-DD format
 * @param market - Market type (KR or US)
 * @returns true if the date is a trading day
 */
export function isTradingDay(date: string, market: MarketType): boolean {
  switch (market) {
    case "KR":
      return isKRXTradingDay(date);
    case "US":
      return isNYSETradingDay(date);
    default:
      return isWeekday(date);
  }
}

/**
 * Find the nearest prior trading day for the given market
 * @param date - Starting date in YYYY-MM-DD format
 * @param market - Market type (KR or US)
 * @returns The nearest prior trading day in YYYY-MM-DD format
 */
export function findNearestPriorTradingDay(date: string, market: MarketType): string {
  switch (market) {
    case "KR":
      return findNearestPriorKRXTradingDay(date);
    case "US":
      return findNearestPriorNYSETradingDay(date);
    default:
      return findNearestPriorWeekday(date);
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a date is a weekday (Monday-Friday)
 */
function isWeekday(dateStr: string): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

/**
 * Find the nearest prior weekday
 */
function findNearestPriorWeekday(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));

  // Go back day by day until we find a weekday
  for (let i = 0; i < 7; i++) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      return formatDate(date);
    }
    date.setDate(date.getDate() - 1);
  }

  return dateStr;
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
