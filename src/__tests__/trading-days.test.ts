/**
 * Trading Days Utility Tests
 *
 * Tests for trading day validation, weekend detection, holiday checking,
 * and nearest prior trading day resolution for KR and US markets.
 */

import { describe, expect, it } from "vitest";
import {
  isWeekend,
  isWeekendString,
  parseLocalDate,
  formatDateString,
  getNearestPriorTradingDay,
  getNearestPriorTradingDayString,
  validateTradingDate,
} from "@/lib/trading-days";
import {
  isMarketHoliday,
  isHoliday,
  isTradingDay,
  findNearestPriorTradingDay,
  isKRXHoliday,
  isNYSEHoliday,
  isKRXTradingDay,
  isNYSETradingDay,
  findNearestPriorKRXTradingDay,
  findNearestPriorNYSETradingDay,
} from "@/lib/market-holidays";

// =============================================================================
// isWeekend Tests
// =============================================================================

describe("isWeekend", () => {
  it("should return true for Saturday", () => {
    // 2024-01-06 is a Saturday
    const saturday = new Date(2024, 0, 6);
    expect(isWeekend(saturday)).toBe(true);
  });

  it("should return true for Sunday", () => {
    // 2024-01-07 is a Sunday
    const sunday = new Date(2024, 0, 7);
    expect(isWeekend(sunday)).toBe(true);
  });

  it("should return false for Monday", () => {
    // 2024-01-08 is a Monday
    const monday = new Date(2024, 0, 8);
    expect(isWeekend(monday)).toBe(false);
  });

  it("should return false for Friday", () => {
    // 2024-01-05 is a Friday
    const friday = new Date(2024, 0, 5);
    expect(isWeekend(friday)).toBe(false);
  });

  it("should return false for Wednesday", () => {
    // 2024-01-03 is a Wednesday
    const wednesday = new Date(2024, 0, 3);
    expect(isWeekend(wednesday)).toBe(false);
  });
});

describe("isWeekendString", () => {
  it("should return true for Saturday date string", () => {
    expect(isWeekendString("2024-01-06")).toBe(true);
  });

  it("should return true for Sunday date string", () => {
    expect(isWeekendString("2024-01-07")).toBe(true);
  });

  it("should return false for weekday date string", () => {
    expect(isWeekendString("2024-01-08")).toBe(false);
    expect(isWeekendString("2024-01-09")).toBe(false);
    expect(isWeekendString("2024-01-10")).toBe(false);
    expect(isWeekendString("2024-01-11")).toBe(false);
    expect(isWeekendString("2024-01-12")).toBe(false);
  });
});

// =============================================================================
// isHoliday Tests
// =============================================================================

describe("isHoliday", () => {
  describe("KR market", () => {
    it("should return true for Korean New Year", () => {
      expect(isHoliday("2024-01-01", "KR")).toBe(true);
    });

    it("should return true for Lunar New Year (Seollal)", () => {
      // 2024 Lunar New Year: Feb 9, 10, 11
      expect(isHoliday("2024-02-09", "KR")).toBe(true);
      expect(isHoliday("2024-02-10", "KR")).toBe(true);
      expect(isHoliday("2024-02-11", "KR")).toBe(true);
    });

    it("should return true for Chuseok", () => {
      // 2024 Chuseok: Sep 16, 17, 18
      expect(isHoliday("2024-09-16", "KR")).toBe(true);
      expect(isHoliday("2024-09-17", "KR")).toBe(true);
      expect(isHoliday("2024-09-18", "KR")).toBe(true);
    });

    it("should return true for Korean substitute holidays", () => {
      // 2024-02-12 is a substitute holiday for Lunar New Year
      expect(isHoliday("2024-02-12", "KR")).toBe(true);
    });

    it("should return false for regular weekdays", () => {
      expect(isHoliday("2024-01-02", "KR")).toBe(false);
      expect(isHoliday("2024-07-15", "KR")).toBe(false);
    });
  });

  describe("US market", () => {
    it("should return true for US New Year", () => {
      expect(isHoliday("2024-01-01", "US")).toBe(true);
    });

    it("should return true for MLK Day", () => {
      expect(isHoliday("2024-01-15", "US")).toBe(true);
    });

    it("should return true for Thanksgiving", () => {
      expect(isHoliday("2024-11-28", "US")).toBe(true);
    });

    it("should return true for Independence Day", () => {
      expect(isHoliday("2024-07-04", "US")).toBe(true);
    });

    it("should return true for Juneteenth", () => {
      expect(isHoliday("2024-06-19", "US")).toBe(true);
    });

    it("should return false for regular weekdays", () => {
      expect(isHoliday("2024-01-02", "US")).toBe(false);
      expect(isHoliday("2024-07-15", "US")).toBe(false);
    });
  });
});

describe("isMarketHoliday", () => {
  it("should be equivalent to isHoliday", () => {
    expect(isMarketHoliday("2024-01-01", "KR")).toBe(isHoliday("2024-01-01", "KR"));
    expect(isMarketHoliday("2024-01-01", "US")).toBe(isHoliday("2024-01-01", "US"));
  });
});

// =============================================================================
// isTradingDay Tests
// =============================================================================

describe("isTradingDay", () => {
  describe("KR market", () => {
    it("should return true for regular weekday (not a holiday)", () => {
      // 2024-01-02 is Tuesday, not a holiday
      expect(isTradingDay("2024-01-02", "KR")).toBe(true);
    });

    it("should return false for weekend", () => {
      expect(isTradingDay("2024-01-06", "KR")).toBe(false); // Saturday
      expect(isTradingDay("2024-01-07", "KR")).toBe(false); // Sunday
    });

    it("should return false for holidays", () => {
      expect(isTradingDay("2024-01-01", "KR")).toBe(false); // New Year
      expect(isTradingDay("2024-02-10", "KR")).toBe(false); // Lunar New Year
    });

    it("should return false for substitute holidays", () => {
      expect(isTradingDay("2024-02-12", "KR")).toBe(false);
    });
  });

  describe("US market", () => {
    it("should return true for regular weekday (not a holiday)", () => {
      // 2024-01-02 is Tuesday, not a holiday
      expect(isTradingDay("2024-01-02", "US")).toBe(true);
    });

    it("should return false for weekend", () => {
      expect(isTradingDay("2024-01-06", "US")).toBe(false); // Saturday
      expect(isTradingDay("2024-01-07", "US")).toBe(false); // Sunday
    });

    it("should return false for holidays", () => {
      expect(isTradingDay("2024-01-01", "US")).toBe(false); // New Year
      expect(isTradingDay("2024-11-28", "US")).toBe(false); // Thanksgiving
    });
  });
});

describe("isKRXTradingDay", () => {
  it("should return true for regular trading day", () => {
    expect(isKRXTradingDay("2024-01-02")).toBe(true);
  });

  it("should return false for weekend", () => {
    expect(isKRXTradingDay("2024-01-06")).toBe(false);
  });

  it("should return false for holiday", () => {
    expect(isKRXTradingDay("2024-01-01")).toBe(false);
  });
});

describe("isNYSETradingDay", () => {
  it("should return true for regular trading day", () => {
    expect(isNYSETradingDay("2024-01-02")).toBe(true);
  });

  it("should return false for weekend", () => {
    expect(isNYSETradingDay("2024-01-06")).toBe(false);
  });

  it("should return false for holiday", () => {
    expect(isNYSETradingDay("2024-01-01")).toBe(false);
  });
});

// =============================================================================
// Nearest Prior Trading Day Tests
// =============================================================================

describe("getNearestPriorTradingDay", () => {
  it("should return same day if it's a weekday", () => {
    const wednesday = new Date(2024, 0, 3);
    const result = getNearestPriorTradingDay(wednesday);
    expect(formatDateString(result)).toBe("2024-01-03");
  });

  it("should return Friday for Saturday", () => {
    const saturday = new Date(2024, 0, 6);
    const result = getNearestPriorTradingDay(saturday);
    expect(formatDateString(result)).toBe("2024-01-05");
  });

  it("should return Friday for Sunday", () => {
    const sunday = new Date(2024, 0, 7);
    const result = getNearestPriorTradingDay(sunday);
    expect(formatDateString(result)).toBe("2024-01-05");
  });
});

describe("getNearestPriorTradingDayString", () => {
  it("should return same day if it's a weekday", () => {
    expect(getNearestPriorTradingDayString("2024-01-03")).toBe("2024-01-03");
  });

  it("should return Friday for Saturday", () => {
    expect(getNearestPriorTradingDayString("2024-01-06")).toBe("2024-01-05");
  });

  it("should return Friday for Sunday", () => {
    expect(getNearestPriorTradingDayString("2024-01-07")).toBe("2024-01-05");
  });
});

describe("findNearestPriorTradingDay", () => {
  describe("KR market", () => {
    it("should return same day if it's a trading day", () => {
      expect(findNearestPriorTradingDay("2024-01-02", "KR")).toBe("2024-01-02");
    });

    it("should skip weekends", () => {
      // 2024-01-06 is Saturday, should return Friday 2024-01-05
      expect(findNearestPriorTradingDay("2024-01-06", "KR")).toBe("2024-01-05");
    });

    it("should skip holidays", () => {
      // 2024-01-01 is New Year's Day holiday
      // But Dec 31 2023 is Sunday, Dec 30 is Saturday
      // So it should return Dec 29, 2023 (Friday)
      expect(findNearestPriorTradingDay("2024-01-01", "KR")).toBe("2023-12-29");
    });

    it("should handle consecutive holidays correctly", () => {
      // 2024-02-09 to 2024-02-12 are Lunar New Year + substitute
      // But 2024-02-10, 11 are also Sat/Sun
      // 2024-02-09 is Friday (holiday)
      // So it should return 2024-02-08 (Thursday)
      expect(findNearestPriorTradingDay("2024-02-09", "KR")).toBe("2024-02-08");
    });
  });

  describe("US market", () => {
    it("should return same day if it's a trading day", () => {
      expect(findNearestPriorTradingDay("2024-01-02", "US")).toBe("2024-01-02");
    });

    it("should skip weekends", () => {
      expect(findNearestPriorTradingDay("2024-01-06", "US")).toBe("2024-01-05");
    });

    it("should skip holidays", () => {
      // 2024-01-01 is New Year's Day
      // Dec 31 2023 is Sunday, Dec 30 is Saturday
      // So it should return Dec 29, 2023 (Friday)
      expect(findNearestPriorTradingDay("2024-01-01", "US")).toBe("2023-12-29");
    });
  });
});

describe("findNearestPriorKRXTradingDay", () => {
  it("should return same day if it's a trading day", () => {
    expect(findNearestPriorKRXTradingDay("2024-01-02")).toBe("2024-01-02");
  });

  it("should skip holidays and weekends", () => {
    expect(findNearestPriorKRXTradingDay("2024-01-01")).toBe("2023-12-29");
  });
});

describe("findNearestPriorNYSETradingDay", () => {
  it("should return same day if it's a trading day", () => {
    expect(findNearestPriorNYSETradingDay("2024-01-02")).toBe("2024-01-02");
  });

  it("should skip holidays and weekends", () => {
    expect(findNearestPriorNYSETradingDay("2024-01-01")).toBe("2023-12-29");
  });
});

// =============================================================================
// Date Parsing and Formatting Tests
// =============================================================================

describe("parseLocalDate", () => {
  it("should parse YYYY-MM-DD format correctly", () => {
    const date = parseLocalDate("2024-01-15");
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January is 0
    expect(date.getDate()).toBe(15);
  });

  it("should handle single digit months and days", () => {
    const date = parseLocalDate("2024-03-05");
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2); // March is 2
    expect(date.getDate()).toBe(5);
  });
});

describe("formatDateString", () => {
  it("should format Date to YYYY-MM-DD string", () => {
    const date = new Date(2024, 0, 15);
    expect(formatDateString(date)).toBe("2024-01-15");
  });

  it("should pad single digit months and days", () => {
    const date = new Date(2024, 2, 5);
    expect(formatDateString(date)).toBe("2024-03-05");
  });
});

// =============================================================================
// validateTradingDate Tests
// =============================================================================

describe("validateTradingDate", () => {
  it("should return invalid for empty string", () => {
    const result = validateTradingDate("");
    expect(result.isValid).toBe(false);
    expect(result.wasCorrected).toBe(false);
  });

  it("should return invalid for invalid date format", () => {
    const result = validateTradingDate("not-a-date");
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Invalid date format");
    expect(result.wasCorrected).toBe(false);
  });

  it("should return valid for regular past weekday", () => {
    // Use a date we know is in the past
    const result = validateTradingDate("2023-06-15");
    expect(result.isValid).toBe(true);
    expect(result.isWeekend).toBe(false);
    expect(result.wasCorrected).toBe(false);
  });

  it("should return valid with weekend flag for Saturday", () => {
    const result = validateTradingDate("2023-01-07"); // Saturday
    expect(result.isValid).toBe(true);
    expect(result.isWeekend).toBe(true);
    expect(result.message).toContain("Weekend selected");
  });

  it("should return corrected date for Saturday", () => {
    const result = validateTradingDate("2023-01-07"); // Saturday
    expect(result.isValid).toBe(true);
    expect(result.wasCorrected).toBe(true);
    expect(result.correctedDate).toBe("2023-01-06"); // Friday
  });

  it("should return corrected date for Sunday", () => {
    const result = validateTradingDate("2023-01-08"); // Sunday
    expect(result.isValid).toBe(true);
    expect(result.wasCorrected).toBe(true);
    expect(result.correctedDate).toBe("2023-01-06"); // Friday
  });

  it("should not correct weekday dates", () => {
    const result = validateTradingDate("2023-06-15"); // Thursday
    expect(result.isValid).toBe(true);
    expect(result.wasCorrected).toBe(false);
    expect(result.correctedDate).toBeUndefined();
  });

  it("should return invalid for future date", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const dateStr = formatDateString(futureDate);
    const result = validateTradingDate(dateStr);
    expect(result.isValid).toBe(false);
    expect(result.isFuture).toBe(true);
    expect(result.wasCorrected).toBe(false);
  });

  it("should return invalid for too old date", () => {
    const result = validateTradingDate("1985-01-01");
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Date is too far in the past");
    expect(result.wasCorrected).toBe(false);
  });
});

// =============================================================================
// Market-Specific Holiday Tests
// =============================================================================

describe("isKRXHoliday", () => {
  it("should detect Korean holidays", () => {
    expect(isKRXHoliday("2024-03-01")).toBe(true); // Independence Movement Day
    expect(isKRXHoliday("2024-05-05")).toBe(true); // Children's Day
    expect(isKRXHoliday("2024-06-06")).toBe(true); // Memorial Day
    expect(isKRXHoliday("2024-08-15")).toBe(true); // Liberation Day
    expect(isKRXHoliday("2024-10-03")).toBe(true); // National Foundation Day
    expect(isKRXHoliday("2024-10-09")).toBe(true); // Hangul Day
    expect(isKRXHoliday("2024-12-25")).toBe(true); // Christmas
  });
});

describe("isNYSEHoliday", () => {
  it("should detect US holidays", () => {
    expect(isNYSEHoliday("2024-02-19")).toBe(true); // Presidents' Day
    expect(isNYSEHoliday("2024-03-29")).toBe(true); // Good Friday
    expect(isNYSEHoliday("2024-05-27")).toBe(true); // Memorial Day
    expect(isNYSEHoliday("2024-09-02")).toBe(true); // Labor Day
    expect(isNYSEHoliday("2024-12-25")).toBe(true); // Christmas
  });
});
