/**
 * NYSE/NASDAQ Market Holidays
 *
 * Comprehensive holiday data for US stock markets (NYSE and NASDAQ).
 * Holidays are pre-computed for years 2015-2030 to support historical
 * lookups and future date validation.
 *
 * Sources:
 * - NYSE Holiday Schedule (https://www.nyse.com/markets/hours-calendars)
 * - NASDAQ Holiday Schedule
 *
 * US stock market holidays include:
 * - Fixed holidays (observed on nearest weekday if on weekend)
 * - Floating holidays (calculated by week/day rules)
 * - Good Friday (varies based on Easter calculation)
 * - Early close days (1:00 PM ET) on certain days
 *
 * Note: NYSE and NASDAQ share the same holiday schedule.
 */

import type { MarketHoliday, HolidayType, HolidayRecurrence } from "@/types/trading-calendar";

// =============================================================================
// Types
// =============================================================================

/**
 * US holiday name identifiers
 */
export type NYSEHolidayName =
  | "NEW_YEARS_DAY" // New Year's Day
  | "MLK_DAY" // Martin Luther King Jr. Day
  | "PRESIDENTS_DAY" // Presidents' Day (Washington's Birthday)
  | "GOOD_FRIDAY" // Good Friday
  | "MEMORIAL_DAY" // Memorial Day
  | "JUNETEENTH" // Juneteenth National Independence Day (since 2021)
  | "INDEPENDENCE_DAY" // Independence Day (July 4th)
  | "LABOR_DAY" // Labor Day
  | "THANKSGIVING" // Thanksgiving Day
  | "CHRISTMAS" // Christmas Day
  | "SPECIAL" // Special market closures (e.g., National Day of Mourning)
  | "EARLY_CLOSE"; // Early close days (1:00 PM ET)

/**
 * Holiday definition with English name and Korean translation
 */
interface HolidayDefinition {
  name: string;
  nameKo: string;
  type: HolidayType;
  recurrence: HolidayRecurrence;
  earlyCloseTime?: string;
}

// =============================================================================
// Holiday Name Definitions
// =============================================================================

const HOLIDAY_DEFINITIONS: Record<NYSEHolidayName, HolidayDefinition> = {
  NEW_YEARS_DAY: {
    name: "New Year's Day",
    nameKo: "새해 첫날",
    type: "public",
    recurrence: "fixed",
  },
  MLK_DAY: {
    name: "Martin Luther King Jr. Day",
    nameKo: "마틴 루터 킹 주니어의 날",
    type: "public",
    recurrence: "floating",
  },
  PRESIDENTS_DAY: {
    name: "Presidents' Day",
    nameKo: "대통령의 날",
    type: "public",
    recurrence: "floating",
  },
  GOOD_FRIDAY: {
    name: "Good Friday",
    nameKo: "성금요일",
    type: "public",
    recurrence: "floating",
  },
  MEMORIAL_DAY: {
    name: "Memorial Day",
    nameKo: "현충일",
    type: "public",
    recurrence: "floating",
  },
  JUNETEENTH: {
    name: "Juneteenth National Independence Day",
    nameKo: "준틴스",
    type: "public",
    recurrence: "fixed",
  },
  INDEPENDENCE_DAY: {
    name: "Independence Day",
    nameKo: "독립기념일",
    type: "public",
    recurrence: "fixed",
  },
  LABOR_DAY: {
    name: "Labor Day",
    nameKo: "노동절",
    type: "public",
    recurrence: "floating",
  },
  THANKSGIVING: {
    name: "Thanksgiving Day",
    nameKo: "추수감사절",
    type: "public",
    recurrence: "floating",
  },
  CHRISTMAS: {
    name: "Christmas Day",
    nameKo: "크리스마스",
    type: "public",
    recurrence: "fixed",
  },
  SPECIAL: {
    name: "Special Market Closure",
    nameKo: "특별 휴장",
    type: "special",
    recurrence: "one_time",
  },
  EARLY_CLOSE: {
    name: "Early Close",
    nameKo: "조기 마감",
    type: "early_close",
    recurrence: "floating",
    earlyCloseTime: "13:00",
  },
};

// =============================================================================
// Pre-computed Holiday Data (2015-2030)
// =============================================================================

/**
 * NYSE/NASDAQ holidays by year
 * Format: [date (YYYY-MM-DD), holidayName, notes?]
 *
 * Note: Dates are pre-computed including observed dates when holidays
 * fall on weekends. Good Friday dates are calculated from Easter dates.
 */
const NYSE_HOLIDAYS_BY_YEAR: Record<number, Array<[string, NYSEHolidayName, string?]>> = {
  2015: [
    ["2015-01-01", "NEW_YEARS_DAY"],
    ["2015-01-19", "MLK_DAY"],
    ["2015-02-16", "PRESIDENTS_DAY"],
    ["2015-04-03", "GOOD_FRIDAY"],
    ["2015-05-25", "MEMORIAL_DAY"],
    ["2015-07-03", "INDEPENDENCE_DAY", "Observed (July 4 is Saturday)"],
    ["2015-09-07", "LABOR_DAY"],
    ["2015-11-26", "THANKSGIVING"],
    ["2015-12-25", "CHRISTMAS"],
  ],
  2016: [
    ["2016-01-01", "NEW_YEARS_DAY"],
    ["2016-01-18", "MLK_DAY"],
    ["2016-02-15", "PRESIDENTS_DAY"],
    ["2016-03-25", "GOOD_FRIDAY"],
    ["2016-05-30", "MEMORIAL_DAY"],
    ["2016-07-04", "INDEPENDENCE_DAY"],
    ["2016-09-05", "LABOR_DAY"],
    ["2016-11-24", "THANKSGIVING"],
    ["2016-12-26", "CHRISTMAS", "Observed (Dec 25 is Sunday)"],
  ],
  2017: [
    ["2017-01-02", "NEW_YEARS_DAY", "Observed (Jan 1 is Sunday)"],
    ["2017-01-16", "MLK_DAY"],
    ["2017-02-20", "PRESIDENTS_DAY"],
    ["2017-04-14", "GOOD_FRIDAY"],
    ["2017-05-29", "MEMORIAL_DAY"],
    ["2017-07-04", "INDEPENDENCE_DAY"],
    ["2017-09-04", "LABOR_DAY"],
    ["2017-11-23", "THANKSGIVING"],
    ["2017-12-25", "CHRISTMAS"],
  ],
  2018: [
    ["2018-01-01", "NEW_YEARS_DAY"],
    ["2018-01-15", "MLK_DAY"],
    ["2018-02-19", "PRESIDENTS_DAY"],
    ["2018-03-30", "GOOD_FRIDAY"],
    ["2018-05-28", "MEMORIAL_DAY"],
    ["2018-07-04", "INDEPENDENCE_DAY"],
    ["2018-09-03", "LABOR_DAY"],
    ["2018-11-22", "THANKSGIVING"],
    ["2018-12-05", "SPECIAL", "National Day of Mourning for President George H.W. Bush"],
    ["2018-12-25", "CHRISTMAS"],
  ],
  2019: [
    ["2019-01-01", "NEW_YEARS_DAY"],
    ["2019-01-21", "MLK_DAY"],
    ["2019-02-18", "PRESIDENTS_DAY"],
    ["2019-04-19", "GOOD_FRIDAY"],
    ["2019-05-27", "MEMORIAL_DAY"],
    ["2019-07-04", "INDEPENDENCE_DAY"],
    ["2019-09-02", "LABOR_DAY"],
    ["2019-11-28", "THANKSGIVING"],
    ["2019-12-25", "CHRISTMAS"],
  ],
  2020: [
    ["2020-01-01", "NEW_YEARS_DAY"],
    ["2020-01-20", "MLK_DAY"],
    ["2020-02-17", "PRESIDENTS_DAY"],
    ["2020-04-10", "GOOD_FRIDAY"],
    ["2020-05-25", "MEMORIAL_DAY"],
    ["2020-07-03", "INDEPENDENCE_DAY", "Observed (July 4 is Saturday)"],
    ["2020-09-07", "LABOR_DAY"],
    ["2020-11-26", "THANKSGIVING"],
    ["2020-12-25", "CHRISTMAS"],
  ],
  2021: [
    ["2021-01-01", "NEW_YEARS_DAY"],
    ["2021-01-18", "MLK_DAY"],
    ["2021-02-15", "PRESIDENTS_DAY"],
    ["2021-04-02", "GOOD_FRIDAY"],
    ["2021-05-31", "MEMORIAL_DAY"],
    ["2021-07-05", "INDEPENDENCE_DAY", "Observed (July 4 is Sunday)"],
    ["2021-09-06", "LABOR_DAY"],
    ["2021-11-25", "THANKSGIVING"],
    ["2021-12-24", "CHRISTMAS", "Observed (Dec 25 is Saturday)"],
  ],
  2022: [
    ["2022-01-17", "MLK_DAY"],
    ["2022-02-21", "PRESIDENTS_DAY"],
    ["2022-04-15", "GOOD_FRIDAY"],
    ["2022-05-30", "MEMORIAL_DAY"],
    ["2022-06-20", "JUNETEENTH", "Observed (June 19 is Sunday)"],
    ["2022-07-04", "INDEPENDENCE_DAY"],
    ["2022-09-05", "LABOR_DAY"],
    ["2022-11-24", "THANKSGIVING"],
    ["2022-12-26", "CHRISTMAS", "Observed (Dec 25 is Sunday)"],
  ],
  2023: [
    ["2023-01-02", "NEW_YEARS_DAY", "Observed (Jan 1 is Sunday)"],
    ["2023-01-16", "MLK_DAY"],
    ["2023-02-20", "PRESIDENTS_DAY"],
    ["2023-04-07", "GOOD_FRIDAY"],
    ["2023-05-29", "MEMORIAL_DAY"],
    ["2023-06-19", "JUNETEENTH"],
    ["2023-07-04", "INDEPENDENCE_DAY"],
    ["2023-09-04", "LABOR_DAY"],
    ["2023-11-23", "THANKSGIVING"],
    ["2023-12-25", "CHRISTMAS"],
  ],
  2024: [
    ["2024-01-01", "NEW_YEARS_DAY"],
    ["2024-01-15", "MLK_DAY"],
    ["2024-02-19", "PRESIDENTS_DAY"],
    ["2024-03-29", "GOOD_FRIDAY"],
    ["2024-05-27", "MEMORIAL_DAY"],
    ["2024-06-19", "JUNETEENTH"],
    ["2024-07-04", "INDEPENDENCE_DAY"],
    ["2024-09-02", "LABOR_DAY"],
    ["2024-11-28", "THANKSGIVING"],
    ["2024-12-25", "CHRISTMAS"],
  ],
  2025: [
    ["2025-01-01", "NEW_YEARS_DAY"],
    ["2025-01-20", "MLK_DAY"],
    ["2025-02-17", "PRESIDENTS_DAY"],
    ["2025-04-18", "GOOD_FRIDAY"],
    ["2025-05-26", "MEMORIAL_DAY"],
    ["2025-06-19", "JUNETEENTH"],
    ["2025-07-04", "INDEPENDENCE_DAY"],
    ["2025-09-01", "LABOR_DAY"],
    ["2025-11-27", "THANKSGIVING"],
    ["2025-12-25", "CHRISTMAS"],
  ],
  2026: [
    ["2026-01-01", "NEW_YEARS_DAY"],
    ["2026-01-19", "MLK_DAY"],
    ["2026-02-16", "PRESIDENTS_DAY"],
    ["2026-04-03", "GOOD_FRIDAY"],
    ["2026-05-25", "MEMORIAL_DAY"],
    ["2026-06-19", "JUNETEENTH"],
    ["2026-07-03", "INDEPENDENCE_DAY", "Observed (July 4 is Saturday)"],
    ["2026-09-07", "LABOR_DAY"],
    ["2026-11-26", "THANKSGIVING"],
    ["2026-12-25", "CHRISTMAS"],
  ],
  2027: [
    ["2027-01-01", "NEW_YEARS_DAY"],
    ["2027-01-18", "MLK_DAY"],
    ["2027-02-15", "PRESIDENTS_DAY"],
    ["2027-03-26", "GOOD_FRIDAY"],
    ["2027-05-31", "MEMORIAL_DAY"],
    ["2027-06-18", "JUNETEENTH", "Observed (June 19 is Saturday)"],
    ["2027-07-05", "INDEPENDENCE_DAY", "Observed (July 4 is Sunday)"],
    ["2027-09-06", "LABOR_DAY"],
    ["2027-11-25", "THANKSGIVING"],
    ["2027-12-24", "CHRISTMAS", "Observed (Dec 25 is Saturday)"],
  ],
  2028: [
    ["2028-01-17", "MLK_DAY"],
    ["2028-02-21", "PRESIDENTS_DAY"],
    ["2028-04-14", "GOOD_FRIDAY"],
    ["2028-05-29", "MEMORIAL_DAY"],
    ["2028-06-19", "JUNETEENTH"],
    ["2028-07-04", "INDEPENDENCE_DAY"],
    ["2028-09-04", "LABOR_DAY"],
    ["2028-11-23", "THANKSGIVING"],
    ["2028-12-25", "CHRISTMAS"],
  ],
  2029: [
    ["2029-01-01", "NEW_YEARS_DAY"],
    ["2029-01-15", "MLK_DAY"],
    ["2029-02-19", "PRESIDENTS_DAY"],
    ["2029-03-30", "GOOD_FRIDAY"],
    ["2029-05-28", "MEMORIAL_DAY"],
    ["2029-06-19", "JUNETEENTH"],
    ["2029-07-04", "INDEPENDENCE_DAY"],
    ["2029-09-03", "LABOR_DAY"],
    ["2029-11-22", "THANKSGIVING"],
    ["2029-12-25", "CHRISTMAS"],
  ],
  2030: [
    ["2030-01-01", "NEW_YEARS_DAY"],
    ["2030-01-21", "MLK_DAY"],
    ["2030-02-18", "PRESIDENTS_DAY"],
    ["2030-04-19", "GOOD_FRIDAY"],
    ["2030-05-27", "MEMORIAL_DAY"],
    ["2030-06-19", "JUNETEENTH"],
    ["2030-07-04", "INDEPENDENCE_DAY"],
    ["2030-09-02", "LABOR_DAY"],
    ["2030-11-28", "THANKSGIVING"],
    ["2030-12-25", "CHRISTMAS"],
  ],
};

/**
 * NYSE/NASDAQ early close days by year
 * Early close at 1:00 PM ET
 * - Day before Independence Day (July 3, unless July 4 falls on Monday)
 * - Day after Thanksgiving (Black Friday)
 * - Christmas Eve (December 24, unless Christmas falls on Monday)
 */
const NYSE_EARLY_CLOSE_BY_YEAR: Record<number, string[]> = {
  2015: ["2015-11-27", "2015-12-24"],
  2016: ["2016-11-25"],
  2017: ["2017-07-03", "2017-11-24"],
  2018: ["2018-07-03", "2018-11-23", "2018-12-24"],
  2019: ["2019-07-03", "2019-11-29", "2019-12-24"],
  2020: ["2020-11-27", "2020-12-24"],
  2021: ["2021-11-26"],
  2022: ["2022-11-25"],
  2023: ["2023-07-03", "2023-11-24"],
  2024: ["2024-07-03", "2024-11-29", "2024-12-24"],
  2025: ["2025-07-03", "2025-11-28", "2025-12-24"],
  2026: ["2026-11-27", "2026-12-24"],
  2027: ["2027-11-26"],
  2028: ["2028-07-03", "2028-11-24"],
  2029: ["2029-07-03", "2029-11-23", "2029-12-24"],
  2030: ["2030-07-03", "2030-11-29", "2030-12-24"],
};

// =============================================================================
// Build Holiday Set for Fast Lookup
// =============================================================================

/**
 * Pre-built Set of all NYSE holiday dates for O(1) lookup
 */
const NYSE_HOLIDAY_DATES: Set<string> = new Set<string>();

/**
 * Pre-built Set of all NYSE early close dates for O(1) lookup
 */
const NYSE_EARLY_CLOSE_DATES: Set<string> = new Set<string>();

/**
 * Map of holiday dates to holiday info for detailed lookup
 */
const NYSE_HOLIDAY_MAP: Map<string, MarketHoliday> = new Map<string, MarketHoliday>();

// Populate the holiday sets and maps
for (const [_year, holidays] of Object.entries(NYSE_HOLIDAYS_BY_YEAR)) {
  for (const [date, holidayName, notes] of holidays) {
    NYSE_HOLIDAY_DATES.add(date);

    const definition = HOLIDAY_DEFINITIONS[holidayName];
    NYSE_HOLIDAY_MAP.set(date, {
      date,
      name: definition.name,
      nameKo: definition.nameKo,
      type: definition.type,
      recurrence: definition.recurrence,
      notes,
    });
  }
}

// Populate the early close sets
for (const [_year, dates] of Object.entries(NYSE_EARLY_CLOSE_BY_YEAR)) {
  for (const date of dates) {
    NYSE_EARLY_CLOSE_DATES.add(date);

    // Also add to holiday map for detailed lookup
    const definition = HOLIDAY_DEFINITIONS.EARLY_CLOSE;
    NYSE_HOLIDAY_MAP.set(date, {
      date,
      name: definition.name,
      nameKo: definition.nameKo,
      type: definition.type,
      recurrence: definition.recurrence,
      earlyCloseTime: definition.earlyCloseTime,
    });
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Check if a date is a NYSE/NASDAQ market holiday (full closure)
 * @param date - Date in YYYY-MM-DD format
 * @returns true if the date is a NYSE holiday
 */
export function isNYSEHoliday(date: string): boolean {
  return NYSE_HOLIDAY_DATES.has(date);
}

/**
 * Check if a date is a NYSE/NASDAQ early close day
 * @param date - Date in YYYY-MM-DD format
 * @returns true if the date is an early close day
 */
export function isNYSEEarlyClose(date: string): boolean {
  return NYSE_EARLY_CLOSE_DATES.has(date);
}

/**
 * Get holiday information for a specific date
 * @param date - Date in YYYY-MM-DD format
 * @returns MarketHoliday object or null if not a holiday
 */
export function getNYSEHoliday(date: string): MarketHoliday | null {
  return NYSE_HOLIDAY_MAP.get(date) ?? null;
}

/**
 * Get all NYSE holidays for a specific year
 * @param year - The year (e.g., 2024)
 * @returns Array of MarketHoliday objects
 */
export function getNYSEHolidaysForYear(year: number): MarketHoliday[] {
  const holidays = NYSE_HOLIDAYS_BY_YEAR[year];
  if (!holidays) {
    return [];
  }

  return holidays.map(([date, holidayName, notes]) => {
    const definition = HOLIDAY_DEFINITIONS[holidayName];
    return {
      date,
      name: definition.name,
      nameKo: definition.nameKo,
      type: definition.type,
      recurrence: definition.recurrence,
      notes,
    };
  });
}

/**
 * Get all NYSE early close days for a specific year
 * @param year - The year (e.g., 2024)
 * @returns Array of dates in YYYY-MM-DD format
 */
export function getNYSEEarlyCloseDaysForYear(year: number): string[] {
  return NYSE_EARLY_CLOSE_BY_YEAR[year] ?? [];
}

/**
 * Get all NYSE holidays within a date range
 * @param startDate - Start date in YYYY-MM-DD format (inclusive)
 * @param endDate - End date in YYYY-MM-DD format (inclusive)
 * @returns Array of MarketHoliday objects sorted by date
 */
export function getNYSEHolidaysInRange(startDate: string, endDate: string): MarketHoliday[] {
  const holidays: MarketHoliday[] = [];

  for (const [date, holiday] of NYSE_HOLIDAY_MAP) {
    if (date >= startDate && date <= endDate && holiday.type !== "early_close") {
      holidays.push(holiday);
    }
  }

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Check if a year has holiday data available
 * @param year - The year to check
 * @returns true if holiday data exists for the year
 */
export function hasNYSEHolidayData(year: number): boolean {
  return year in NYSE_HOLIDAYS_BY_YEAR;
}

/**
 * Get the range of years with available NYSE holiday data
 * @returns Object with min and max years
 */
export function getNYSEHolidayDataRange(): { minYear: number; maxYear: number } {
  const years = Object.keys(NYSE_HOLIDAYS_BY_YEAR).map(Number);
  return {
    minYear: Math.min(...years),
    maxYear: Math.max(...years),
  };
}

/**
 * Get all dates (as Set) for fast bulk checking
 * @returns Set of all NYSE holiday dates
 */
export function getAllNYSEHolidayDates(): ReadonlySet<string> {
  return NYSE_HOLIDAY_DATES;
}

/**
 * Get all early close dates (as Set) for fast bulk checking
 * @returns Set of all NYSE early close dates
 */
export function getAllNYSEEarlyCloseDates(): ReadonlySet<string> {
  return NYSE_EARLY_CLOSE_DATES;
}

/**
 * Check if a date is a NYSE trading day (not weekend, not holiday)
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns true if the date is a trading day
 */
export function isNYSETradingDay(dateStr: string): boolean {
  // Check if it's a holiday first (fast lookup)
  if (isNYSEHoliday(dateStr)) {
    return false;
  }

  // Check if it's a weekend
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  const dayOfWeek = date.getDay();

  // Sunday = 0, Saturday = 6
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

/**
 * Find the nearest prior NYSE trading day
 * @param dateStr - Starting date in YYYY-MM-DD format
 * @returns The nearest prior trading day in YYYY-MM-DD format
 */
export function findNearestPriorNYSETradingDay(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  let year = Number(yearStr);
  let month = Number(monthStr) - 1; // JS months are 0-indexed
  let day = Number(dayStr);

  const date = new Date(year, month, day);

  // Go back day by day until we find a trading day
  // Limit to 10 days to prevent infinite loops (longest holiday stretch is usually < 10 days)
  for (let i = 0; i < 10; i++) {
    const currentDateStr = formatDate(date);

    if (isNYSETradingDay(currentDateStr)) {
      return currentDateStr;
    }

    // Move to previous day
    date.setDate(date.getDate() - 1);
  }

  // Fallback: return original date (shouldn't happen in practice)
  return dateStr;
}

/**
 * Get holiday name in the specified locale
 * @param date - Date in YYYY-MM-DD format
 * @param locale - 'ko' or 'en'
 * @returns Holiday name or null if not a holiday
 */
export function getNYSEHolidayName(date: string, locale: "ko" | "en"): string | null {
  const holiday = getNYSEHoliday(date);
  if (!holiday) {
    return null;
  }
  return locale === "ko" ? holiday.nameKo ?? holiday.name : holiday.name;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format a Date object to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// =============================================================================
// NYSE Market Hours (Standard)
// =============================================================================

/**
 * Standard NYSE/NASDAQ market hours
 * Both exchanges share the same trading hours in Eastern Time
 */
export const NYSE_MARKET_HOURS = {
  timezone: "America/New_York",
  openTime: "09:30",
  closeTime: "16:00",
} as const;

/**
 * NYSE early close time (for half-day trading sessions)
 * On early close days, market closes at 1:00 PM ET
 */
export const NYSE_EARLY_CLOSE_TIME = "13:00" as const;

/**
 * NYSE pre-market hours (extended trading)
 */
export const NYSE_PRE_MARKET_HOURS = {
  openTime: "04:00",
  closeTime: "09:30",
} as const;

/**
 * NYSE after-hours (extended trading)
 */
export const NYSE_AFTER_HOURS = {
  openTime: "16:00",
  closeTime: "20:00",
} as const;
