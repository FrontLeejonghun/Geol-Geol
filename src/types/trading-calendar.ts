/**
 * Trading Calendar Types
 *
 * TypeScript types and interfaces for trading calendar data structures.
 * Supports both KR and US markets with holiday information and
 * trading day validation.
 */

import type { MarketType, MarketHours } from "./stock";

// =============================================================================
// Market Holiday Types
// =============================================================================

/**
 * Type of market holiday
 */
export type HolidayType =
  | "public" // National public holiday
  | "market" // Exchange-specific holiday (e.g., exchange maintenance)
  | "early_close" // Early market close (half-day trading)
  | "special"; // Special closures (e.g., weather, mourning)

/**
 * Recurrence pattern for holidays
 */
export type HolidayRecurrence =
  | "fixed" // Same date every year (e.g., Christmas Dec 25)
  | "floating" // Varies each year (e.g., Thanksgiving)
  | "lunar" // Based on lunar calendar (e.g., Chuseok, Lunar New Year)
  | "one_time"; // Non-recurring special closure

/**
 * Represents a market holiday
 */
export interface MarketHoliday {
  /** Holiday date in ISO format (YYYY-MM-DD) */
  date: string;

  /** Holiday name in English */
  name: string;

  /** Holiday name in Korean (for KR market) */
  nameKo?: string;

  /** Type of holiday */
  type: HolidayType;

  /** Recurrence pattern */
  recurrence: HolidayRecurrence;

  /**
   * For early_close type: the closing time in local market timezone
   * e.g., "13:00" for KRX early close days
   */
  earlyCloseTime?: string;

  /**
   * Additional notes about the holiday
   */
  notes?: string;
}

/**
 * Observed holiday instance (resolved for a specific year)
 * When a holiday falls on a weekend, markets may observe it on adjacent weekday
 */
export interface ObservedHoliday extends MarketHoliday {
  /** Original holiday date (if observed date differs) */
  originalDate?: string;

  /** Whether this is the observed date (different from original) */
  isObserved: boolean;
}

// =============================================================================
// Trading Calendar Types
// =============================================================================

/**
 * Status of a specific trading day
 */
export type TradingDayStatus =
  | "open" // Regular trading day
  | "closed" // Market closed (holiday or weekend)
  | "early_close" // Partial trading day
  | "unknown"; // Status not yet determined (future dates)

/**
 * Information about a specific trading day
 */
export interface TradingDay {
  /** Date in ISO format (YYYY-MM-DD) */
  date: string;

  /** Trading status for this day */
  status: TradingDayStatus;

  /** If closed or early close, the associated holiday (if any) */
  holiday?: MarketHoliday;

  /** Whether this is a weekend */
  isWeekend: boolean;

  /** Market hours for this day (null if closed) */
  marketHours: MarketHours | null;
}

/**
 * Trading calendar for a specific market and year
 */
export interface TradingCalendar {
  /** Market identifier */
  market: MarketType;

  /** Calendar year */
  year: number;

  /** Standard market hours for this calendar */
  standardHours: MarketHours;

  /** List of all holidays for this year */
  holidays: MarketHoliday[];

  /**
   * Map of dates (YYYY-MM-DD) to trading day information
   * Only populated for queried/cached dates, not the entire year
   */
  tradingDays?: Map<string, TradingDay>;

  /** Timestamp when this calendar was last updated */
  lastUpdated: string;

  /** Source of holiday data (e.g., "krx", "nyse", "yahoo-finance") */
  source: string;
}

/**
 * Compact trading calendar for serialization/caching
 * Uses arrays instead of Maps for JSON compatibility
 */
export interface TradingCalendarCompact {
  /** Market identifier */
  market: MarketType;

  /** Calendar year */
  year: number;

  /** Standard market hours for this calendar */
  standardHours: MarketHours;

  /** List of all holidays for this year (dates as strings) */
  holidays: MarketHoliday[];

  /**
   * Array of non-trading dates (YYYY-MM-DD) for quick lookup
   * Excludes weekends (handled separately)
   */
  closedDates: string[];

  /**
   * Array of early close dates with their close times
   */
  earlyCloseDates: Array<{
    date: string;
    closeTime: string;
  }>;

  /** Timestamp when this calendar was last updated */
  lastUpdated: string;

  /** Source of holiday data */
  source: string;
}

// =============================================================================
// Trading Calendar Query Types
// =============================================================================

/**
 * Query parameters for trading calendar lookup
 */
export interface TradingCalendarQuery {
  /** Market to query */
  market: MarketType;

  /** Start date for range queries (ISO format) */
  startDate?: string;

  /** End date for range queries (ISO format) */
  endDate?: string;

  /** Specific year to query (alternative to date range) */
  year?: number;
}

/**
 * Result of a trading day lookup
 */
export interface TradingDayLookupResult {
  /** The requested date */
  requestedDate: string;

  /** The resolved trading day (may be different if requested date was non-trading) */
  resolvedDate: string;

  /** Whether the date was adjusted */
  wasAdjusted: boolean;

  /** Direction of adjustment (if any) */
  adjustmentDirection?: "prior" | "next";

  /** Number of days adjusted */
  adjustmentDays?: number;

  /** Information about the resolved trading day */
  tradingDay: TradingDay;
}

// =============================================================================
// Pre-defined Holiday Data Types
// =============================================================================

/**
 * Holiday definition template (for generating yearly calendars)
 */
export interface HolidayTemplate {
  /** Holiday name in English */
  name: string;

  /** Holiday name in Korean */
  nameKo?: string;

  /** Type of holiday */
  type: HolidayType;

  /** Recurrence pattern */
  recurrence: HolidayRecurrence;

  /**
   * For fixed holidays: month and day (1-indexed)
   * e.g., { month: 12, day: 25 } for Christmas
   */
  fixedDate?: {
    month: number;
    day: number;
  };

  /**
   * For floating holidays: rule to calculate the date
   * e.g., "4th Thursday of November" for Thanksgiving
   */
  floatingRule?: {
    month: number;
    week: 1 | 2 | 3 | 4 | 5 | -1; // -1 = last week
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  };

  /**
   * For early_close type: the closing time
   */
  earlyCloseTime?: string;

  /**
   * Year range during which this holiday applies
   */
  validYears?: {
    start?: number;
    end?: number;
  };
}

/**
 * Market holiday definitions for a specific market
 */
export interface MarketHolidayDefinitions {
  /** Market identifier */
  market: MarketType;

  /** Holiday templates for this market */
  holidays: HolidayTemplate[];

  /** Last updated timestamp */
  lastUpdated: string;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Date range for trading calendar operations
 */
export interface DateRange {
  /** Start date (ISO format, inclusive) */
  start: string;

  /** End date (ISO format, inclusive) */
  end: string;
}

/**
 * Trading calendar cache entry
 */
export interface TradingCalendarCacheEntry {
  /** The cached calendar data */
  calendar: TradingCalendarCompact;

  /** Cache timestamp */
  cachedAt: string;

  /** Cache TTL in seconds */
  ttlSeconds: number;

  /** Whether this cache entry is still valid */
  isValid: boolean;
}

/**
 * Trading calendar service configuration
 */
export interface TradingCalendarConfig {
  /** Cache TTL for calendar data (in seconds) */
  cacheTtlSeconds: number;

  /** Maximum years to cache */
  maxCachedYears: number;

  /** Whether to fetch live data or use static definitions */
  useLiveData: boolean;

  /** Fallback to static definitions if live fetch fails */
  fallbackToStatic: boolean;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a trading day is open for trading
 */
export function isTradingDayOpen(day: TradingDay): boolean {
  return day.status === "open" || day.status === "early_close";
}

/**
 * Check if a trading day is fully closed
 */
export function isTradingDayClosed(day: TradingDay): boolean {
  return day.status === "closed";
}

/**
 * Check if a holiday type requires market closure
 */
export function isClosureHoliday(type: HolidayType): boolean {
  return type === "public" || type === "market" || type === "special";
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a market holiday object
 */
export function createMarketHoliday(
  date: string,
  name: string,
  type: HolidayType = "public",
  recurrence: HolidayRecurrence = "fixed",
  options?: Partial<Omit<MarketHoliday, "date" | "name" | "type" | "recurrence">>
): MarketHoliday {
  return {
    date,
    name,
    type,
    recurrence,
    ...options,
  };
}

/**
 * Create a trading day object
 */
export function createTradingDay(
  date: string,
  status: TradingDayStatus,
  isWeekend: boolean,
  marketHours: MarketHours | null,
  holiday?: MarketHoliday
): TradingDay {
  return {
    date,
    status,
    isWeekend,
    marketHours,
    holiday,
  };
}

/**
 * Create an empty trading calendar for a market and year
 */
export function createEmptyTradingCalendar(
  market: MarketType,
  year: number,
  standardHours: MarketHours,
  source: string = "static"
): TradingCalendar {
  return {
    market,
    year,
    standardHours,
    holidays: [],
    tradingDays: new Map(),
    lastUpdated: new Date().toISOString(),
    source,
  };
}

/**
 * Convert a TradingCalendar to compact format for serialization
 */
export function toCompactCalendar(calendar: TradingCalendar): TradingCalendarCompact {
  const closedDates: string[] = [];
  const earlyCloseDates: Array<{ date: string; closeTime: string }> = [];

  for (const holiday of calendar.holidays) {
    if (holiday.type === "early_close" && holiday.earlyCloseTime) {
      earlyCloseDates.push({
        date: holiday.date,
        closeTime: holiday.earlyCloseTime,
      });
    } else if (isClosureHoliday(holiday.type)) {
      closedDates.push(holiday.date);
    }
  }

  return {
    market: calendar.market,
    year: calendar.year,
    standardHours: calendar.standardHours,
    holidays: calendar.holidays,
    closedDates,
    earlyCloseDates,
    lastUpdated: calendar.lastUpdated,
    source: calendar.source,
  };
}

/**
 * Convert a compact calendar back to full TradingCalendar
 */
export function fromCompactCalendar(compact: TradingCalendarCompact): TradingCalendar {
  return {
    market: compact.market,
    year: compact.year,
    standardHours: compact.standardHours,
    holidays: compact.holidays,
    tradingDays: new Map(),
    lastUpdated: compact.lastUpdated,
    source: compact.source,
  };
}
