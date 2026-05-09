/**
 * KRX (Korea Exchange) Market Holidays
 *
 * Comprehensive holiday data for the Korean stock market (KOSPI/KOSDAQ).
 * Holidays are pre-computed for years 2015-2030 to support historical
 * lookups and future date validation.
 *
 * Sources:
 * - Korea Exchange (KRX) official holiday calendar
 * - Korea Astronomy and Space Science Institute (KASI) for lunar calendar dates
 *
 * Korean stock market holidays include:
 * - Fixed holidays (same date every year)
 * - Lunar calendar holidays (varying dates)
 * - Substitute holidays (when holidays fall on weekends)
 */

import type { MarketHoliday, HolidayType, HolidayRecurrence } from "@/types/trading-calendar";

// =============================================================================
// Types
// =============================================================================

/**
 * Korean holiday name identifiers
 */
export type KRXHolidayName =
  | "NEW_YEAR" // 신정
  | "LUNAR_NEW_YEAR" // 설날
  | "INDEPENDENCE_DAY" // 삼일절
  | "CHILDRENS_DAY" // 어린이날
  | "BUDDHAS_BIRTHDAY" // 석가탄신일
  | "MEMORIAL_DAY" // 현충일
  | "LIBERATION_DAY" // 광복절
  | "CHUSEOK" // 추석
  | "NATIONAL_FOUNDATION_DAY" // 개천절
  | "HANGUL_DAY" // 한글날
  | "CHRISTMAS" // 성탄절
  | "SUBSTITUTE" // 대체공휴일
  | "ELECTION_DAY" // 선거일
  | "SPECIAL"; // 특별휴장

/**
 * Holiday definition with English and Korean names
 */
interface HolidayDefinition {
  name: string;
  nameKo: string;
  type: HolidayType;
  recurrence: HolidayRecurrence;
}

// =============================================================================
// Holiday Name Definitions
// =============================================================================

const HOLIDAY_DEFINITIONS: Record<KRXHolidayName, HolidayDefinition> = {
  NEW_YEAR: {
    name: "New Year's Day",
    nameKo: "신정",
    type: "public",
    recurrence: "fixed",
  },
  LUNAR_NEW_YEAR: {
    name: "Lunar New Year",
    nameKo: "설날",
    type: "public",
    recurrence: "lunar",
  },
  INDEPENDENCE_DAY: {
    name: "Independence Movement Day",
    nameKo: "삼일절",
    type: "public",
    recurrence: "fixed",
  },
  CHILDRENS_DAY: {
    name: "Children's Day",
    nameKo: "어린이날",
    type: "public",
    recurrence: "fixed",
  },
  BUDDHAS_BIRTHDAY: {
    name: "Buddha's Birthday",
    nameKo: "석가탄신일",
    type: "public",
    recurrence: "lunar",
  },
  MEMORIAL_DAY: {
    name: "Memorial Day",
    nameKo: "현충일",
    type: "public",
    recurrence: "fixed",
  },
  LIBERATION_DAY: {
    name: "Liberation Day",
    nameKo: "광복절",
    type: "public",
    recurrence: "fixed",
  },
  CHUSEOK: {
    name: "Chuseok",
    nameKo: "추석",
    type: "public",
    recurrence: "lunar",
  },
  NATIONAL_FOUNDATION_DAY: {
    name: "National Foundation Day",
    nameKo: "개천절",
    type: "public",
    recurrence: "fixed",
  },
  HANGUL_DAY: {
    name: "Hangul Proclamation Day",
    nameKo: "한글날",
    type: "public",
    recurrence: "fixed",
  },
  CHRISTMAS: {
    name: "Christmas",
    nameKo: "성탄절",
    type: "public",
    recurrence: "fixed",
  },
  SUBSTITUTE: {
    name: "Substitute Holiday",
    nameKo: "대체공휴일",
    type: "public",
    recurrence: "one_time",
  },
  ELECTION_DAY: {
    name: "Election Day",
    nameKo: "선거일",
    type: "public",
    recurrence: "one_time",
  },
  SPECIAL: {
    name: "Special Market Closure",
    nameKo: "특별휴장",
    type: "special",
    recurrence: "one_time",
  },
};

// =============================================================================
// Pre-computed Holiday Data (2015-2030)
// =============================================================================

/**
 * KRX holidays by year
 * Format: [date (YYYY-MM-DD), holidayName]
 *
 * Note: Lunar calendar holidays (설날, 추석, 석가탄신일) are pre-computed
 * using KASI lunar calendar data.
 */
const KRX_HOLIDAYS_BY_YEAR: Record<number, Array<[string, KRXHolidayName, string?]>> = {
  2015: [
    ["2015-01-01", "NEW_YEAR"],
    ["2015-02-18", "LUNAR_NEW_YEAR"], // 설날 전날
    ["2015-02-19", "LUNAR_NEW_YEAR"], // 설날
    ["2015-02-20", "LUNAR_NEW_YEAR"], // 설날 다음날
    ["2015-03-01", "INDEPENDENCE_DAY"],
    ["2015-05-05", "CHILDRENS_DAY"],
    ["2015-05-25", "BUDDHAS_BIRTHDAY"],
    ["2015-06-06", "MEMORIAL_DAY"],
    ["2015-08-14", "LIBERATION_DAY"], // Observed (Aug 15 is Sat)
    ["2015-09-26", "CHUSEOK"], // 추석 전날
    ["2015-09-27", "CHUSEOK"], // 추석
    ["2015-09-28", "CHUSEOK"], // 추석 다음날
    ["2015-09-29", "SUBSTITUTE"], // 대체공휴일
    ["2015-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2015-10-09", "HANGUL_DAY"],
    ["2015-12-25", "CHRISTMAS"],
  ],
  2016: [
    ["2016-01-01", "NEW_YEAR"],
    ["2016-02-07", "LUNAR_NEW_YEAR"],
    ["2016-02-08", "LUNAR_NEW_YEAR"],
    ["2016-02-09", "LUNAR_NEW_YEAR"],
    ["2016-02-10", "SUBSTITUTE"],
    ["2016-03-01", "INDEPENDENCE_DAY"],
    ["2016-04-13", "ELECTION_DAY"], // 20th National Assembly election
    ["2016-05-05", "CHILDRENS_DAY"],
    ["2016-05-06", "SUBSTITUTE"],
    ["2016-05-14", "BUDDHAS_BIRTHDAY"],
    ["2016-06-06", "MEMORIAL_DAY"],
    ["2016-08-15", "LIBERATION_DAY"],
    ["2016-09-14", "CHUSEOK"],
    ["2016-09-15", "CHUSEOK"],
    ["2016-09-16", "CHUSEOK"],
    ["2016-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2016-10-09", "HANGUL_DAY"],
    ["2016-12-25", "CHRISTMAS"],
  ],
  2017: [
    ["2017-01-01", "NEW_YEAR"],
    ["2017-01-27", "LUNAR_NEW_YEAR"],
    ["2017-01-28", "LUNAR_NEW_YEAR"],
    ["2017-01-29", "LUNAR_NEW_YEAR"],
    ["2017-01-30", "SUBSTITUTE"],
    ["2017-03-01", "INDEPENDENCE_DAY"],
    ["2017-05-03", "BUDDHAS_BIRTHDAY"],
    ["2017-05-05", "CHILDRENS_DAY"],
    ["2017-05-09", "ELECTION_DAY"], // Presidential election
    ["2017-06-06", "MEMORIAL_DAY"],
    ["2017-08-15", "LIBERATION_DAY"],
    ["2017-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2017-10-04", "CHUSEOK"],
    ["2017-10-05", "CHUSEOK"],
    ["2017-10-06", "CHUSEOK"],
    ["2017-10-09", "HANGUL_DAY"],
    ["2017-12-25", "CHRISTMAS"],
  ],
  2018: [
    ["2018-01-01", "NEW_YEAR"],
    ["2018-02-15", "LUNAR_NEW_YEAR"],
    ["2018-02-16", "LUNAR_NEW_YEAR"],
    ["2018-02-17", "LUNAR_NEW_YEAR"],
    ["2018-03-01", "INDEPENDENCE_DAY"],
    ["2018-05-05", "CHILDRENS_DAY"],
    ["2018-05-07", "SUBSTITUTE"],
    ["2018-05-22", "BUDDHAS_BIRTHDAY"],
    ["2018-06-06", "MEMORIAL_DAY"],
    ["2018-06-13", "ELECTION_DAY"], // Local elections
    ["2018-08-15", "LIBERATION_DAY"],
    ["2018-09-23", "CHUSEOK"],
    ["2018-09-24", "CHUSEOK"],
    ["2018-09-25", "CHUSEOK"],
    ["2018-09-26", "SUBSTITUTE"],
    ["2018-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2018-10-09", "HANGUL_DAY"],
    ["2018-12-25", "CHRISTMAS"],
  ],
  2019: [
    ["2019-01-01", "NEW_YEAR"],
    ["2019-02-04", "LUNAR_NEW_YEAR"],
    ["2019-02-05", "LUNAR_NEW_YEAR"],
    ["2019-02-06", "LUNAR_NEW_YEAR"],
    ["2019-03-01", "INDEPENDENCE_DAY"],
    ["2019-05-05", "CHILDRENS_DAY"],
    ["2019-05-06", "SUBSTITUTE"],
    ["2019-05-12", "BUDDHAS_BIRTHDAY"],
    ["2019-06-06", "MEMORIAL_DAY"],
    ["2019-08-15", "LIBERATION_DAY"],
    ["2019-09-12", "CHUSEOK"],
    ["2019-09-13", "CHUSEOK"],
    ["2019-09-14", "CHUSEOK"],
    ["2019-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2019-10-09", "HANGUL_DAY"],
    ["2019-12-25", "CHRISTMAS"],
  ],
  2020: [
    ["2020-01-01", "NEW_YEAR"],
    ["2020-01-24", "LUNAR_NEW_YEAR"],
    ["2020-01-25", "LUNAR_NEW_YEAR"],
    ["2020-01-26", "LUNAR_NEW_YEAR"],
    ["2020-01-27", "SUBSTITUTE"],
    ["2020-03-01", "INDEPENDENCE_DAY"],
    ["2020-04-15", "ELECTION_DAY"], // 21st National Assembly election
    ["2020-04-30", "BUDDHAS_BIRTHDAY"],
    ["2020-05-05", "CHILDRENS_DAY"],
    ["2020-06-06", "MEMORIAL_DAY"],
    ["2020-08-15", "LIBERATION_DAY"],
    ["2020-08-17", "SUBSTITUTE"],
    ["2020-09-30", "CHUSEOK"],
    ["2020-10-01", "CHUSEOK"],
    ["2020-10-02", "CHUSEOK"],
    ["2020-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2020-10-09", "HANGUL_DAY"],
    ["2020-12-25", "CHRISTMAS"],
  ],
  2021: [
    ["2021-01-01", "NEW_YEAR"],
    ["2021-02-11", "LUNAR_NEW_YEAR"],
    ["2021-02-12", "LUNAR_NEW_YEAR"],
    ["2021-02-13", "LUNAR_NEW_YEAR"],
    ["2021-03-01", "INDEPENDENCE_DAY"],
    ["2021-05-05", "CHILDRENS_DAY"],
    ["2021-05-19", "BUDDHAS_BIRTHDAY"],
    ["2021-06-06", "MEMORIAL_DAY"],
    ["2021-08-15", "LIBERATION_DAY"],
    ["2021-08-16", "SUBSTITUTE"],
    ["2021-09-20", "CHUSEOK"],
    ["2021-09-21", "CHUSEOK"],
    ["2021-09-22", "CHUSEOK"],
    ["2021-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2021-10-04", "SUBSTITUTE"],
    ["2021-10-09", "HANGUL_DAY"],
    ["2021-10-11", "SUBSTITUTE"],
    ["2021-12-25", "CHRISTMAS"],
  ],
  2022: [
    ["2022-01-01", "NEW_YEAR"],
    ["2022-01-31", "LUNAR_NEW_YEAR"],
    ["2022-02-01", "LUNAR_NEW_YEAR"],
    ["2022-02-02", "LUNAR_NEW_YEAR"],
    ["2022-03-01", "INDEPENDENCE_DAY"],
    ["2022-03-09", "ELECTION_DAY"], // Presidential election
    ["2022-05-05", "CHILDRENS_DAY"],
    ["2022-05-08", "BUDDHAS_BIRTHDAY"],
    ["2022-06-01", "ELECTION_DAY"], // Local elections
    ["2022-06-06", "MEMORIAL_DAY"],
    ["2022-08-15", "LIBERATION_DAY"],
    ["2022-09-09", "CHUSEOK"],
    ["2022-09-10", "CHUSEOK"],
    ["2022-09-11", "CHUSEOK"],
    ["2022-09-12", "SUBSTITUTE"],
    ["2022-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2022-10-09", "HANGUL_DAY"],
    ["2022-10-10", "SUBSTITUTE"],
    ["2022-12-25", "CHRISTMAS"],
  ],
  2023: [
    ["2023-01-01", "NEW_YEAR"],
    ["2023-01-21", "LUNAR_NEW_YEAR"],
    ["2023-01-22", "LUNAR_NEW_YEAR"],
    ["2023-01-23", "LUNAR_NEW_YEAR"],
    ["2023-01-24", "SUBSTITUTE"],
    ["2023-03-01", "INDEPENDENCE_DAY"],
    ["2023-05-05", "CHILDRENS_DAY"],
    ["2023-05-27", "BUDDHAS_BIRTHDAY"],
    ["2023-05-29", "SUBSTITUTE"],
    ["2023-06-06", "MEMORIAL_DAY"],
    ["2023-08-15", "LIBERATION_DAY"],
    ["2023-09-28", "CHUSEOK"],
    ["2023-09-29", "CHUSEOK"],
    ["2023-09-30", "CHUSEOK"],
    ["2023-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2023-10-09", "HANGUL_DAY"],
    ["2023-12-25", "CHRISTMAS"],
  ],
  2024: [
    ["2024-01-01", "NEW_YEAR"],
    ["2024-02-09", "LUNAR_NEW_YEAR"],
    ["2024-02-10", "LUNAR_NEW_YEAR"],
    ["2024-02-11", "LUNAR_NEW_YEAR"],
    ["2024-02-12", "SUBSTITUTE"],
    ["2024-03-01", "INDEPENDENCE_DAY"],
    ["2024-04-10", "ELECTION_DAY"], // 22nd National Assembly election
    ["2024-05-05", "CHILDRENS_DAY"],
    ["2024-05-06", "SUBSTITUTE"],
    ["2024-05-15", "BUDDHAS_BIRTHDAY"],
    ["2024-06-06", "MEMORIAL_DAY"],
    ["2024-08-15", "LIBERATION_DAY"],
    ["2024-09-16", "CHUSEOK"],
    ["2024-09-17", "CHUSEOK"],
    ["2024-09-18", "CHUSEOK"],
    ["2024-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2024-10-09", "HANGUL_DAY"],
    ["2024-12-25", "CHRISTMAS"],
  ],
  2025: [
    ["2025-01-01", "NEW_YEAR"],
    ["2025-01-28", "LUNAR_NEW_YEAR"],
    ["2025-01-29", "LUNAR_NEW_YEAR"],
    ["2025-01-30", "LUNAR_NEW_YEAR"],
    ["2025-03-01", "INDEPENDENCE_DAY"],
    ["2025-03-03", "SUBSTITUTE"],
    ["2025-05-05", "CHILDRENS_DAY"],
    ["2025-05-06", "BUDDHAS_BIRTHDAY"],
    ["2025-06-06", "MEMORIAL_DAY"],
    ["2025-08-15", "LIBERATION_DAY"],
    ["2025-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2025-10-05", "CHUSEOK"],
    ["2025-10-06", "CHUSEOK"],
    ["2025-10-07", "CHUSEOK"],
    ["2025-10-08", "SUBSTITUTE"],
    ["2025-10-09", "HANGUL_DAY"],
    ["2025-12-25", "CHRISTMAS"],
  ],
  2026: [
    ["2026-01-01", "NEW_YEAR"],
    ["2026-02-16", "LUNAR_NEW_YEAR"],
    ["2026-02-17", "LUNAR_NEW_YEAR"],
    ["2026-02-18", "LUNAR_NEW_YEAR"],
    ["2026-03-01", "INDEPENDENCE_DAY"],
    ["2026-03-02", "SUBSTITUTE"],
    ["2026-05-05", "CHILDRENS_DAY"],
    ["2026-05-24", "BUDDHAS_BIRTHDAY"],
    ["2026-05-25", "SUBSTITUTE"],
    ["2026-06-04", "ELECTION_DAY"], // Local elections
    ["2026-06-06", "MEMORIAL_DAY"],
    ["2026-08-15", "LIBERATION_DAY"],
    ["2026-08-17", "SUBSTITUTE"],
    ["2026-09-24", "CHUSEOK"],
    ["2026-09-25", "CHUSEOK"],
    ["2026-09-26", "CHUSEOK"],
    ["2026-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2026-10-05", "SUBSTITUTE"],
    ["2026-10-09", "HANGUL_DAY"],
    ["2026-12-25", "CHRISTMAS"],
  ],
  2027: [
    ["2027-01-01", "NEW_YEAR"],
    ["2027-02-06", "LUNAR_NEW_YEAR"],
    ["2027-02-07", "LUNAR_NEW_YEAR"],
    ["2027-02-08", "LUNAR_NEW_YEAR"],
    ["2027-02-09", "SUBSTITUTE"],
    ["2027-03-01", "INDEPENDENCE_DAY"],
    ["2027-05-05", "CHILDRENS_DAY"],
    ["2027-05-13", "BUDDHAS_BIRTHDAY"],
    ["2027-06-06", "MEMORIAL_DAY"],
    ["2027-08-15", "LIBERATION_DAY"],
    ["2027-08-16", "SUBSTITUTE"],
    ["2027-09-14", "CHUSEOK"],
    ["2027-09-15", "CHUSEOK"],
    ["2027-09-16", "CHUSEOK"],
    ["2027-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2027-10-04", "SUBSTITUTE"],
    ["2027-10-09", "HANGUL_DAY"],
    ["2027-10-11", "SUBSTITUTE"],
    ["2027-12-25", "CHRISTMAS"],
  ],
  2028: [
    ["2028-01-01", "NEW_YEAR"],
    ["2028-01-26", "LUNAR_NEW_YEAR"],
    ["2028-01-27", "LUNAR_NEW_YEAR"],
    ["2028-01-28", "LUNAR_NEW_YEAR"],
    ["2028-03-01", "INDEPENDENCE_DAY"],
    ["2028-04-12", "ELECTION_DAY"], // 23rd National Assembly election
    ["2028-05-02", "BUDDHAS_BIRTHDAY"],
    ["2028-05-05", "CHILDRENS_DAY"],
    ["2028-06-06", "MEMORIAL_DAY"],
    ["2028-08-15", "LIBERATION_DAY"],
    ["2028-10-02", "CHUSEOK"],
    ["2028-10-03", "CHUSEOK"],
    ["2028-10-04", "CHUSEOK"],
    ["2028-10-05", "SUBSTITUTE"],
    ["2028-10-09", "HANGUL_DAY"],
    ["2028-12-25", "CHRISTMAS"],
  ],
  2029: [
    ["2029-01-01", "NEW_YEAR"],
    ["2029-02-12", "LUNAR_NEW_YEAR"],
    ["2029-02-13", "LUNAR_NEW_YEAR"],
    ["2029-02-14", "LUNAR_NEW_YEAR"],
    ["2029-03-01", "INDEPENDENCE_DAY"],
    ["2029-05-05", "CHILDRENS_DAY"],
    ["2029-05-07", "SUBSTITUTE"],
    ["2029-05-20", "BUDDHAS_BIRTHDAY"],
    ["2029-05-21", "SUBSTITUTE"],
    ["2029-06-06", "MEMORIAL_DAY"],
    ["2029-08-15", "LIBERATION_DAY"],
    ["2029-09-21", "CHUSEOK"],
    ["2029-09-22", "CHUSEOK"],
    ["2029-09-23", "CHUSEOK"],
    ["2029-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2029-10-09", "HANGUL_DAY"],
    ["2029-12-25", "CHRISTMAS"],
  ],
  2030: [
    ["2030-01-01", "NEW_YEAR"],
    ["2030-02-02", "LUNAR_NEW_YEAR"],
    ["2030-02-03", "LUNAR_NEW_YEAR"],
    ["2030-02-04", "LUNAR_NEW_YEAR"],
    ["2030-03-01", "INDEPENDENCE_DAY"],
    ["2030-05-05", "CHILDRENS_DAY"],
    ["2030-05-06", "SUBSTITUTE"],
    ["2030-05-09", "BUDDHAS_BIRTHDAY"],
    ["2030-06-06", "MEMORIAL_DAY"],
    ["2030-08-15", "LIBERATION_DAY"],
    ["2030-09-11", "CHUSEOK"],
    ["2030-09-12", "CHUSEOK"],
    ["2030-09-13", "CHUSEOK"],
    ["2030-10-03", "NATIONAL_FOUNDATION_DAY"],
    ["2030-10-09", "HANGUL_DAY"],
    ["2030-12-25", "CHRISTMAS"],
  ],
};

// =============================================================================
// Build Holiday Set for Fast Lookup
// =============================================================================

/**
 * Pre-built Set of all KRX holiday dates for O(1) lookup
 */
const KRX_HOLIDAY_DATES: Set<string> = new Set<string>();

/**
 * Map of holiday dates to holiday info for detailed lookup
 */
const KRX_HOLIDAY_MAP: Map<string, MarketHoliday> = new Map<string, MarketHoliday>();

// Populate the sets and maps
for (const [_year, holidays] of Object.entries(KRX_HOLIDAYS_BY_YEAR)) {
  for (const [date, holidayName, notes] of holidays) {
    KRX_HOLIDAY_DATES.add(date);

    const definition = HOLIDAY_DEFINITIONS[holidayName];
    KRX_HOLIDAY_MAP.set(date, {
      date,
      name: definition.name,
      nameKo: definition.nameKo,
      type: definition.type,
      recurrence: definition.recurrence,
      notes,
    });
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Check if a date is a KRX market holiday
 * @param date - Date in YYYY-MM-DD format
 * @returns true if the date is a KRX holiday
 */
export function isKRXHoliday(date: string): boolean {
  return KRX_HOLIDAY_DATES.has(date);
}

/**
 * Get holiday information for a specific date
 * @param date - Date in YYYY-MM-DD format
 * @returns MarketHoliday object or null if not a holiday
 */
export function getKRXHoliday(date: string): MarketHoliday | null {
  return KRX_HOLIDAY_MAP.get(date) ?? null;
}

/**
 * Get all KRX holidays for a specific year
 * @param year - The year (e.g., 2024)
 * @returns Array of MarketHoliday objects
 */
export function getKRXHolidaysForYear(year: number): MarketHoliday[] {
  const holidays = KRX_HOLIDAYS_BY_YEAR[year];
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
 * Get all KRX holidays within a date range
 * @param startDate - Start date in YYYY-MM-DD format (inclusive)
 * @param endDate - End date in YYYY-MM-DD format (inclusive)
 * @returns Array of MarketHoliday objects sorted by date
 */
export function getKRXHolidaysInRange(startDate: string, endDate: string): MarketHoliday[] {
  const holidays: MarketHoliday[] = [];

  for (const [date, holiday] of KRX_HOLIDAY_MAP) {
    if (date >= startDate && date <= endDate) {
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
export function hasKRXHolidayData(year: number): boolean {
  return year in KRX_HOLIDAYS_BY_YEAR;
}

/**
 * Get the range of years with available KRX holiday data
 * @returns Object with min and max years
 */
export function getKRXHolidayDataRange(): { minYear: number; maxYear: number } {
  const years = Object.keys(KRX_HOLIDAYS_BY_YEAR).map(Number);
  return {
    minYear: Math.min(...years),
    maxYear: Math.max(...years),
  };
}

/**
 * Get all dates (as Set) for fast bulk checking
 * @returns Set of all KRX holiday dates
 */
export function getAllKRXHolidayDates(): ReadonlySet<string> {
  return KRX_HOLIDAY_DATES;
}

/**
 * Check if a date is a KRX trading day (not weekend, not holiday)
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns true if the date is a trading day
 */
export function isKRXTradingDay(dateStr: string): boolean {
  // Check if it's a holiday first (fast lookup)
  if (isKRXHoliday(dateStr)) {
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
 * Find the nearest prior KRX trading day
 * @param dateStr - Starting date in YYYY-MM-DD format
 * @returns The nearest prior trading day in YYYY-MM-DD format
 */
export function findNearestPriorKRXTradingDay(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  let year = Number(yearStr);
  let month = Number(monthStr) - 1; // JS months are 0-indexed
  let day = Number(dayStr);

  const date = new Date(year, month, day);

  // Go back day by day until we find a trading day
  // Limit to 10 days to prevent infinite loops (longest holiday stretch is usually < 10 days)
  for (let i = 0; i < 10; i++) {
    const currentDateStr = formatDate(date);

    if (isKRXTradingDay(currentDateStr)) {
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
export function getKRXHolidayName(date: string, locale: "ko" | "en"): string | null {
  const holiday = getKRXHoliday(date);
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
// KRX Market Hours (Standard)
// =============================================================================

/**
 * Standard KRX market hours
 * KOSPI and KOSDAQ share the same trading hours
 */
export const KRX_MARKET_HOURS = {
  timezone: "Asia/Seoul",
  openTime: "09:00",
  closeTime: "15:30",
} as const;

/**
 * KRX early close time (for special half-day trading sessions)
 */
export const KRX_EARLY_CLOSE_TIME = "13:00" as const;
