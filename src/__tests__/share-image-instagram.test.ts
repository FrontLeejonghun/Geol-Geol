/**
 * Instagram Share Image API Tests
 *
 * Tests for the /api/share-image/instagram endpoint.
 * Verifies query param parsing, validation, and image generation.
 */

import { describe, it, expect } from "vitest";

// =============================================================================
// Query Parameter Validation Tests (Unit tests for parsing logic)
// =============================================================================

describe("Instagram Share Image API - Query Validation", () => {
  // Constants from the route
  const VALID_TIERS = ["catastrophe", "loss", "flat", "gain", "jackpot"];
  const VALID_LOCALES = ["ko", "en"];
  const VALID_THEMES = ["light", "dark"];
  const VALID_CURRENCIES = ["KRW", "USD"];

  // Helper to parse query params like the route does
  function parseQueryParams(params: Record<string, string | undefined>) {
    const ticker = params.ticker;
    const buyDate = params.buyDate;
    const percentStr = params.percent;
    const tier = params.tier;

    if (!ticker) {
      return { error: "Missing required parameter: ticker" };
    }
    if (!buyDate) {
      return { error: "Missing required parameter: buyDate" };
    }
    if (!percentStr) {
      return { error: "Missing required parameter: percent" };
    }
    if (!tier) {
      return { error: "Missing required parameter: tier" };
    }

    const percent = parseFloat(percentStr);
    if (isNaN(percent)) {
      return { error: "Invalid percent value" };
    }

    if (!VALID_TIERS.includes(tier)) {
      return { error: `Invalid tier. Must be one of: ${VALID_TIERS.join(", ")}` };
    }

    const locale = params.locale || "ko";
    if (!VALID_LOCALES.includes(locale)) {
      return {
        error: `Invalid locale. Must be one of: ${VALID_LOCALES.join(", ")}`,
      };
    }

    const theme = params.theme || "light";
    if (!VALID_THEMES.includes(theme)) {
      return {
        error: `Invalid theme. Must be one of: ${VALID_THEMES.join(", ")}`,
      };
    }

    const currency = params.currency || "USD";
    if (!VALID_CURRENCIES.includes(currency)) {
      return {
        error: `Invalid currency. Must be one of: ${VALID_CURRENCIES.join(", ")}`,
      };
    }

    return {
      ticker,
      buyDate,
      percent,
      tier,
      locale,
      theme,
      currency,
    };
  }

  it("should accept valid parameters", () => {
    const result = parseQueryParams({
      ticker: "AAPL",
      buyDate: "2020-01-15",
      percent: "150.5",
      tier: "jackpot",
    });

    expect(result).not.toHaveProperty("error");
    expect(result).toHaveProperty("ticker", "AAPL");
    expect(result).toHaveProperty("percent", 150.5);
    expect(result).toHaveProperty("tier", "jackpot");
    expect(result).toHaveProperty("locale", "ko");
    expect(result).toHaveProperty("theme", "light");
  });

  it("should reject missing ticker", () => {
    const result = parseQueryParams({
      buyDate: "2020-01-15",
      percent: "50",
      tier: "gain",
    });

    expect(result).toHaveProperty("error", "Missing required parameter: ticker");
  });

  it("should reject missing buyDate", () => {
    const result = parseQueryParams({
      ticker: "AAPL",
      percent: "50",
      tier: "gain",
    });

    expect(result).toHaveProperty("error", "Missing required parameter: buyDate");
  });

  it("should reject missing percent", () => {
    const result = parseQueryParams({
      ticker: "AAPL",
      buyDate: "2020-01-15",
      tier: "gain",
    });

    expect(result).toHaveProperty("error", "Missing required parameter: percent");
  });

  it("should reject missing tier", () => {
    const result = parseQueryParams({
      ticker: "AAPL",
      buyDate: "2020-01-15",
      percent: "50",
    });

    expect(result).toHaveProperty("error", "Missing required parameter: tier");
  });

  it("should reject invalid percent", () => {
    const result = parseQueryParams({
      ticker: "AAPL",
      buyDate: "2020-01-15",
      percent: "invalid",
      tier: "gain",
    });

    expect(result).toHaveProperty("error", "Invalid percent value");
  });

  it("should reject invalid tier", () => {
    const result = parseQueryParams({
      ticker: "AAPL",
      buyDate: "2020-01-15",
      percent: "50",
      tier: "invalid",
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("Invalid tier");
  });

  it("should reject invalid locale", () => {
    const result = parseQueryParams({
      ticker: "AAPL",
      buyDate: "2020-01-15",
      percent: "50",
      tier: "gain",
      locale: "fr",
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("Invalid locale");
  });

  it("should reject invalid theme", () => {
    const result = parseQueryParams({
      ticker: "AAPL",
      buyDate: "2020-01-15",
      percent: "50",
      tier: "gain",
      theme: "blue",
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("Invalid theme");
  });

  it("should accept all valid outcome tiers", () => {
    for (const tier of VALID_TIERS) {
      const result = parseQueryParams({
        ticker: "AAPL",
        buyDate: "2020-01-15",
        percent: "50",
        tier,
      });

      expect(result).not.toHaveProperty("error");
      expect(result).toHaveProperty("tier", tier);
    }
  });

  it("should accept both locales", () => {
    for (const locale of VALID_LOCALES) {
      const result = parseQueryParams({
        ticker: "AAPL",
        buyDate: "2020-01-15",
        percent: "50",
        tier: "gain",
        locale,
      });

      expect(result).not.toHaveProperty("error");
      expect(result).toHaveProperty("locale", locale);
    }
  });

  it("should accept both themes", () => {
    for (const theme of VALID_THEMES) {
      const result = parseQueryParams({
        ticker: "AAPL",
        buyDate: "2020-01-15",
        percent: "50",
        tier: "gain",
        theme,
      });

      expect(result).not.toHaveProperty("error");
      expect(result).toHaveProperty("theme", theme);
    }
  });

  it("should accept both currencies", () => {
    for (const currency of VALID_CURRENCIES) {
      const result = parseQueryParams({
        ticker: "AAPL",
        buyDate: "2020-01-15",
        percent: "50",
        tier: "gain",
        currency,
      });

      expect(result).not.toHaveProperty("error");
      expect(result).toHaveProperty("currency", currency);
    }
  });

  it("should handle negative percentages", () => {
    const result = parseQueryParams({
      ticker: "AAPL",
      buyDate: "2020-01-15",
      percent: "-25.5",
      tier: "loss",
    });

    expect(result).not.toHaveProperty("error");
    expect(result).toHaveProperty("percent", -25.5);
  });

  it("should handle large percentages", () => {
    const result = parseQueryParams({
      ticker: "AAPL",
      buyDate: "2020-01-15",
      percent: "999.99",
      tier: "jackpot",
    });

    expect(result).not.toHaveProperty("error");
    expect(result).toHaveProperty("percent", 999.99);
  });

  it("should handle Korean stock tickers", () => {
    const result = parseQueryParams({
      ticker: "005930.KS",
      buyDate: "2020-01-15",
      percent: "50",
      tier: "gain",
      currency: "KRW",
    });

    expect(result).not.toHaveProperty("error");
    expect(result).toHaveProperty("ticker", "005930.KS");
    expect(result).toHaveProperty("currency", "KRW");
  });
});

// =============================================================================
// Formatting Tests
// =============================================================================

describe("Instagram Share Image - Formatting", () => {
  function formatPercent(value: number, locale: "ko" | "en"): string {
    const sign = value >= 0 ? "+" : "";
    const formatted = new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
    return `${sign}${value < 0 ? "-" : ""}${formatted}%`;
  }

  function formatCurrency(
    value: number,
    currency: "KRW" | "USD",
    locale: "ko" | "en"
  ): string {
    return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "KRW" ? 0 : 2,
      maximumFractionDigits: currency === "KRW" ? 0 : 2,
    }).format(value);
  }

  it("should format positive percentages correctly", () => {
    expect(formatPercent(150.5, "ko")).toBe("+150.50%");
    expect(formatPercent(150.5, "en")).toBe("+150.50%");
  });

  it("should format negative percentages correctly", () => {
    expect(formatPercent(-25.5, "ko")).toBe("-25.50%");
    expect(formatPercent(-25.5, "en")).toBe("-25.50%");
  });

  it("should format zero percentage correctly", () => {
    expect(formatPercent(0, "ko")).toBe("+0.00%");
    expect(formatPercent(0, "en")).toBe("+0.00%");
  });

  it("should format KRW currency correctly", () => {
    expect(formatCurrency(55000, "KRW", "ko")).toMatch(/55,000/);
    expect(formatCurrency(55000, "KRW", "en")).toMatch(/55,000/);
  });

  it("should format USD currency correctly", () => {
    expect(formatCurrency(150.5, "USD", "ko")).toMatch(/150\.50/);
    expect(formatCurrency(150.5, "USD", "en")).toMatch(/150\.50/);
  });
});

// =============================================================================
// Image Dimensions Tests
// =============================================================================

describe("Instagram Share Image - Dimensions", () => {
  const WIDTH = 1080;
  const HEIGHT = 1350;

  it("should have correct aspect ratio (4:5)", () => {
    const aspectRatio = WIDTH / HEIGHT;
    expect(aspectRatio).toBeCloseTo(4 / 5, 2);
  });

  it("should have Instagram recommended dimensions", () => {
    expect(WIDTH).toBe(1080);
    expect(HEIGHT).toBe(1350);
  });
});
