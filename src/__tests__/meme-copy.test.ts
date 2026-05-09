/**
 * Meme Copy System Tests
 *
 * Tests for the meme copy pool and selection system.
 * Verifies that each locale/tier has the required number of variations
 * and that selection works correctly.
 */

import { describe, it, expect } from "vitest";
import {
  selectMemeCopy,
  getAllMemeCopies,
  getMemeCopyFromProfit,
  getTierAndCopy,
} from "@/lib/calculation";
import type { OutcomeTier, Locale } from "@/types/stock";

const LOCALES: Locale[] = ["ko", "en"];
const TIERS: OutcomeTier[] = ["catastrophe", "loss", "flat", "gain", "jackpot"];

describe("Meme Copy Pool Structure", () => {
  describe.each(LOCALES)("Locale: %s", (locale) => {
    it.each(TIERS)("has at least 3 variations for %s tier", (tier) => {
      const copies = getAllMemeCopies(locale, tier);
      expect(copies.length).toBeGreaterThanOrEqual(3);
    });

    it("has at least 15 total variations", () => {
      let totalCount = 0;
      for (const tier of TIERS) {
        totalCount += getAllMemeCopies(locale, tier).length;
      }
      expect(totalCount).toBeGreaterThanOrEqual(15);
    });

    it.each(TIERS)("all %s copies have headline and subline", (tier) => {
      const copies = getAllMemeCopies(locale, tier);
      for (const copy of copies) {
        expect(copy).toHaveProperty("headline");
        expect(copy).toHaveProperty("subline");
        expect(typeof copy.headline).toBe("string");
        expect(typeof copy.subline).toBe("string");
        expect(copy.headline.length).toBeGreaterThan(0);
        expect(copy.subline.length).toBeGreaterThan(0);
      }
    });
  });
});

describe("Korean (ko) Meme Copy Quality", () => {
  it("has at least 5 variations per tier", () => {
    for (const tier of TIERS) {
      const copies = getAllMemeCopies("ko", tier);
      expect(copies.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("has at least 25 total Korean variations", () => {
    let totalCount = 0;
    for (const tier of TIERS) {
      totalCount += getAllMemeCopies("ko", tier).length;
    }
    expect(totalCount).toBeGreaterThanOrEqual(25);
  });

  it("catastrophe copies convey relief emotion", () => {
    const copies = getAllMemeCopies("ko", "catastrophe");
    // Check that at least one copy contains relief-related Korean words
    const reliefWords = ["다행", "휴", "잘했", "안 사", "안사"];
    const hasReliefCopy = copies.some((copy) =>
      reliefWords.some(
        (word) => copy.headline.includes(word) || copy.subline.includes(word)
      )
    );
    expect(hasReliefCopy).toBe(true);
  });

  it("jackpot copies convey intense regret emotion", () => {
    const copies = getAllMemeCopies("ko", "jackpot");
    // Check that at least one copy contains regret-related Korean words
    const regretWords = ["살껄", "살걸", "ㅠ", "왜", "인생"];
    const hasRegretCopy = copies.some((copy) =>
      regretWords.some(
        (word) => copy.headline.includes(word) || copy.subline.includes(word)
      )
    );
    expect(hasRegretCopy).toBe(true);
  });

  it("gain copies contain the signature phrase 살껄", () => {
    const copies = getAllMemeCopies("ko", "gain");
    const hasSalkkul = copies.some(
      (copy) => copy.headline.includes("살껄") || copy.headline.includes("살걸")
    );
    expect(hasSalkkul).toBe(true);
  });
});

describe("selectMemeCopy Function", () => {
  it.each(LOCALES)("returns a valid MemeCopy for %s locale", (locale) => {
    for (const tier of TIERS) {
      const copy = selectMemeCopy(locale, tier);
      expect(copy).toHaveProperty("headline");
      expect(copy).toHaveProperty("subline");
      expect(typeof copy.headline).toBe("string");
      expect(typeof copy.subline).toBe("string");
    }
  });

  it("returns copies from the pool", () => {
    // Run multiple times to verify randomness returns valid copies
    for (let i = 0; i < 10; i++) {
      for (const tier of TIERS) {
        const selected = selectMemeCopy("ko", tier);
        const pool = getAllMemeCopies("ko", tier);
        // The selected copy should exist in the pool
        const exists = pool.some(
          (copy) =>
            copy.headline === selected.headline &&
            copy.subline === selected.subline
        );
        expect(exists).toBe(true);
      }
    }
  });

  it("exhibits randomness in selection (probabilistic)", () => {
    // Run 100 selections and check that we get more than one unique result
    // for tiers with multiple variations
    const selections = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const copy = selectMemeCopy("ko", "jackpot");
      selections.add(`${copy.headline}|${copy.subline}`);
    }
    // With 6 variations and 100 trials, we should see multiple unique selections
    expect(selections.size).toBeGreaterThan(1);
  });
});

describe("Meme Copy Content Validation", () => {
  it("no empty strings in any copy", () => {
    for (const locale of LOCALES) {
      for (const tier of TIERS) {
        const copies = getAllMemeCopies(locale, tier);
        for (const copy of copies) {
          expect(copy.headline.trim().length).toBeGreaterThan(0);
          expect(copy.subline.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("Korean copies contain Korean characters", () => {
    const koreanRegex = /[가-힯]/; // Hangul syllables range
    for (const tier of TIERS) {
      const copies = getAllMemeCopies("ko", tier);
      for (const copy of copies) {
        const hasKorean =
          koreanRegex.test(copy.headline) || koreanRegex.test(copy.subline);
        expect(hasKorean).toBe(true);
      }
    }
  });

  it("English copies do not contain Korean characters", () => {
    const koreanRegex = /[가-힯]/;
    for (const tier of TIERS) {
      const copies = getAllMemeCopies("en", tier);
      for (const copy of copies) {
        expect(koreanRegex.test(copy.headline)).toBe(false);
        expect(koreanRegex.test(copy.subline)).toBe(false);
      }
    }
  });
});

describe("getMemeCopyFromProfit", () => {
  it("returns catastrophe copy for < -50%", () => {
    const copy = getMemeCopyFromProfit(-75, "ko");
    const pool = getAllMemeCopies("ko", "catastrophe");
    const exists = pool.some(
      (c) => c.headline === copy.headline && c.subline === copy.subline
    );
    expect(exists).toBe(true);
  });

  it("returns loss copy for >= -50% AND < 0%", () => {
    const copy = getMemeCopyFromProfit(-25, "ko");
    const pool = getAllMemeCopies("ko", "loss");
    const exists = pool.some(
      (c) => c.headline === copy.headline && c.subline === copy.subline
    );
    expect(exists).toBe(true);
  });

  it("returns flat copy for >= 0% AND < 10%", () => {
    const copy = getMemeCopyFromProfit(5, "ko");
    const pool = getAllMemeCopies("ko", "flat");
    const exists = pool.some(
      (c) => c.headline === copy.headline && c.subline === copy.subline
    );
    expect(exists).toBe(true);
  });

  it("returns gain copy for >= 10% AND < 100%", () => {
    const copy = getMemeCopyFromProfit(50, "ko");
    const pool = getAllMemeCopies("ko", "gain");
    const exists = pool.some(
      (c) => c.headline === copy.headline && c.subline === copy.subline
    );
    expect(exists).toBe(true);
  });

  it("returns jackpot copy for >= 100%", () => {
    const copy = getMemeCopyFromProfit(200, "ko");
    const pool = getAllMemeCopies("ko", "jackpot");
    const exists = pool.some(
      (c) => c.headline === copy.headline && c.subline === copy.subline
    );
    expect(exists).toBe(true);
  });

  it.each(LOCALES)("works correctly for %s locale", (locale) => {
    // Test all tier boundaries for each locale
    const testCases = [
      { profit: -100, tier: "catastrophe" },
      { profit: -50, tier: "loss" },
      { profit: 0, tier: "flat" },
      { profit: 10, tier: "gain" },
      { profit: 100, tier: "jackpot" },
    ] as const;

    for (const { profit, tier } of testCases) {
      const copy = getMemeCopyFromProfit(profit, locale);
      const pool = getAllMemeCopies(locale, tier);
      const exists = pool.some(
        (c) => c.headline === copy.headline && c.subline === copy.subline
      );
      expect(exists).toBe(true);
    }
  });

  it("exhibits randomness across multiple calls", () => {
    const selections = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const copy = getMemeCopyFromProfit(200, "ko"); // jackpot tier has 6 variations
      selections.add(`${copy.headline}|${copy.subline}`);
    }
    // With 6 variations and 100 trials, we should see multiple unique selections
    expect(selections.size).toBeGreaterThan(1);
  });
});

describe("getTierAndCopy", () => {
  it("returns both tier and copy", () => {
    const result = getTierAndCopy(-75, "ko");
    expect(result).toHaveProperty("tier");
    expect(result).toHaveProperty("copy");
    expect(result.tier).toBe("catastrophe");
    expect(result.copy).toHaveProperty("headline");
    expect(result.copy).toHaveProperty("subline");
  });

  it("returns correct tier for each threshold", () => {
    expect(getTierAndCopy(-51, "ko").tier).toBe("catastrophe");
    expect(getTierAndCopy(-50, "ko").tier).toBe("loss");
    expect(getTierAndCopy(-1, "ko").tier).toBe("loss");
    expect(getTierAndCopy(0, "ko").tier).toBe("flat");
    expect(getTierAndCopy(9.99, "ko").tier).toBe("flat");
    expect(getTierAndCopy(10, "ko").tier).toBe("gain");
    expect(getTierAndCopy(99.99, "ko").tier).toBe("gain");
    expect(getTierAndCopy(100, "ko").tier).toBe("jackpot");
    expect(getTierAndCopy(500, "ko").tier).toBe("jackpot");
  });

  it("copy matches the returned tier", () => {
    for (const locale of LOCALES) {
      const testCases = [
        { profit: -75, tier: "catastrophe" },
        { profit: -25, tier: "loss" },
        { profit: 5, tier: "flat" },
        { profit: 50, tier: "gain" },
        { profit: 200, tier: "jackpot" },
      ] as const;

      for (const { profit, tier } of testCases) {
        const result = getTierAndCopy(profit, locale);
        expect(result.tier).toBe(tier);

        const pool = getAllMemeCopies(locale, tier);
        const exists = pool.some(
          (c) => c.headline === result.copy.headline && c.subline === result.copy.subline
        );
        expect(exists).toBe(true);
      }
    }
  });

  it.each(LOCALES)("works for %s locale", (locale) => {
    const result = getTierAndCopy(150, locale);
    expect(result.tier).toBe("jackpot");
    expect(typeof result.copy.headline).toBe("string");
    expect(typeof result.copy.subline).toBe("string");
  });
});
