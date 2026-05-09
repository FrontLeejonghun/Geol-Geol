/**
 * Trading Days Utility
 *
 * Utilities for working with trading days across KR and US markets.
 * Note: For v1, we check weekends client-side. Holiday resolution happens
 * server-side via yahoo-finance2 when fetching historical data.
 */

import type { MarketType } from "@/types/stock";

// =============================================================================
// Types
// =============================================================================

export interface DateValidation {
  /** Whether the date is valid for selection */
  isValid: boolean;
  /** Whether this is definitely a weekend */
  isWeekend: boolean;
  /** Whether the date is in the future (invalid) */
  isFuture: boolean;
  /** Whether the date is today */
  isToday: boolean;
  /** Validation message to display */
  message?: string;
  /** The corrected trading day (if original was weekend/holiday) */
  correctedDate?: string;
  /** Whether the date was auto-corrected */
  wasCorrected: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Get the earliest supported date for historical data
 * Yahoo Finance generally has data from 1990s onwards
 */
const EARLIEST_SUPPORTED_DATE = new Date("1990-01-01");

// =============================================================================
// Date Utilities
// =============================================================================

/**
 * Parse a date string (YYYY-MM-DD) into a Date object in local timezone
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year!, month! - 1, day);
}

/**
 * Format a Date to YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayString(): string {
  return formatDateString(new Date());
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 */
export function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateString(yesterday);
}

/**
 * Get a date N days ago as YYYY-MM-DD string
 */
export function getDaysAgoString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateString(date);
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a date string is a weekend
 */
export function isWeekendString(dateString: string): boolean {
  return isWeekend(parseLocalDate(dateString));
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Check if a date is too old (before supported date)
 */
export function isTooOld(date: Date): boolean {
  return date < EARLIEST_SUPPORTED_DATE;
}

// =============================================================================
// Trading Day Validation
// =============================================================================

/**
 * Validate a date for stock trading
 * Returns validation status with appropriate messages
 */
export function validateTradingDate(
  dateString: string,
  _market?: MarketType
): DateValidation {
  // Empty date
  if (!dateString) {
    return {
      isValid: false,
      isWeekend: false,
      isFuture: false,
      isToday: false,
      message: undefined,
      wasCorrected: false,
    };
  }

  const date = parseLocalDate(dateString);

  // Check for invalid date
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      isWeekend: false,
      isFuture: false,
      isToday: false,
      message: "Invalid date format",
      wasCorrected: false,
    };
  }

  // Check for future date
  if (isFutureDate(date)) {
    return {
      isValid: false,
      isWeekend: false,
      isFuture: true,
      isToday: false,
      message: "Date must be in the past",
      wasCorrected: false,
    };
  }

  // Check for today
  if (isToday(date)) {
    return {
      isValid: false,
      isWeekend: false,
      isFuture: false,
      isToday: true,
      message: "Please select a past date",
      wasCorrected: false,
    };
  }

  // Check for too old
  if (isTooOld(date)) {
    return {
      isValid: false,
      isWeekend: false,
      isFuture: false,
      isToday: false,
      message: "Date is too far in the past",
      wasCorrected: false,
    };
  }

  // Check for weekend - still valid but will show hint and calculate correction
  const weekend = isWeekend(date);
  let correctedDate: string | undefined;
  let wasCorrected = false;

  if (weekend) {
    const corrected = getNearestPriorTradingDay(date);
    correctedDate = formatDateString(corrected);
    wasCorrected = correctedDate !== dateString;
  }

  return {
    isValid: true,
    isWeekend: weekend,
    isFuture: false,
    isToday: false,
    message: weekend
      ? "Weekend selected - will use last trading day"
      : undefined,
    correctedDate,
    wasCorrected,
  };
}

/**
 * Find the nearest prior trading day (skipping weekends)
 * Note: This is a client-side estimate. Server will resolve holidays.
 */
export function getNearestPriorTradingDay(date: Date): Date {
  const result = new Date(date);

  // If weekend, go back to Friday
  while (isWeekend(result)) {
    result.setDate(result.getDate() - 1);
  }

  return result;
}

/**
 * Get the nearest prior trading day as a string
 */
export function getNearestPriorTradingDayString(dateString: string): string {
  const date = parseLocalDate(dateString);
  return formatDateString(getNearestPriorTradingDay(date));
}

// =============================================================================
// Quick Date Presets
// =============================================================================

export interface DatePreset {
  /** Translation key (e.g., "1week", "1month") */
  key: string;
  /** Fallback English label */
  label: string;
  /** Date value in YYYY-MM-DD format */
  value: string;
  /** Fallback Korean label */
  labelKo: string;
}

/**
 * Get common date presets for quick selection
 */
export function getDatePresets(): DatePreset[] {
  const now = new Date();

  // Calculate preset dates
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);

  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);

  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(now.getFullYear() - 2);

  const fiveYearsAgo = new Date(now);
  fiveYearsAgo.setFullYear(now.getFullYear() - 5);

  return [
    { key: "1week", label: "1 week ago", labelKo: "1주 전", value: formatDateString(oneWeekAgo) },
    { key: "1month", label: "1 month ago", labelKo: "1달 전", value: formatDateString(oneMonthAgo) },
    { key: "3months", label: "3 months ago", labelKo: "3달 전", value: formatDateString(threeMonthsAgo) },
    { key: "6months", label: "6 months ago", labelKo: "6달 전", value: formatDateString(sixMonthsAgo) },
    { key: "1year", label: "1 year ago", labelKo: "1년 전", value: formatDateString(oneYearAgo) },
    { key: "2years", label: "2 years ago", labelKo: "2년 전", value: formatDateString(twoYearsAgo) },
    { key: "5years", label: "5 years ago", labelKo: "5년 전", value: formatDateString(fiveYearsAgo) },
  ];
}
