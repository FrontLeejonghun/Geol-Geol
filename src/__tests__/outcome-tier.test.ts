/**
 * Outcome Tier System Tests
 *
 * Tests for the outcome tier classification based on P&L percentage.
 * Thresholds:
 * - catastrophe: < -50%
 * - loss:        >= -50% AND < 0%
 * - flat:        >= 0% AND < 10%
 * - gain:        >= 10% AND < 100%
 * - jackpot:     >= 100%
 */

import { describe, it, expect } from "vitest";
import {
  getOutcomeTier,
  getOutcomeTierBounds,
  OutcomeTier,
  OUTCOME_THRESHOLDS,
  OUTCOME_TIER_ORDER,
} from "@/types/stock";

describe("OUTCOME_THRESHOLDS", () => {
  it("defines correct threshold values", () => {
    expect(OUTCOME_THRESHOLDS.CATASTROPHE_UPPER).toBe(-50);
    expect(OUTCOME_THRESHOLDS.LOSS_UPPER).toBe(0);
    expect(OUTCOME_THRESHOLDS.FLAT_UPPER).toBe(10);
    expect(OUTCOME_THRESHOLDS.GAIN_UPPER).toBe(100);
  });
});

describe("OUTCOME_TIER_ORDER", () => {
  it("lists tiers from worst to best", () => {
    expect(OUTCOME_TIER_ORDER).toEqual([
      "catastrophe",
      "loss",
      "flat",
      "gain",
      "jackpot",
    ]);
  });

  it("has exactly 5 tiers", () => {
    expect(OUTCOME_TIER_ORDER).toHaveLength(5);
  });
});

describe("getOutcomeTier", () => {
  describe("catastrophe tier (< -50%)", () => {
    it("returns catastrophe for -100%", () => {
      expect(getOutcomeTier(-100)).toBe("catastrophe");
    });

    it("returns catastrophe for -75%", () => {
      expect(getOutcomeTier(-75)).toBe("catastrophe");
    });

    it("returns catastrophe for -50.01%", () => {
      expect(getOutcomeTier(-50.01)).toBe("catastrophe");
    });

    it("returns catastrophe for extreme loss", () => {
      expect(getOutcomeTier(-99.99)).toBe("catastrophe");
    });
  });

  describe("loss tier (>= -50% AND < 0%)", () => {
    it("returns loss for exactly -50%", () => {
      expect(getOutcomeTier(-50)).toBe("loss");
    });

    it("returns loss for -49.99%", () => {
      expect(getOutcomeTier(-49.99)).toBe("loss");
    });

    it("returns loss for -25%", () => {
      expect(getOutcomeTier(-25)).toBe("loss");
    });

    it("returns loss for -0.01%", () => {
      expect(getOutcomeTier(-0.01)).toBe("loss");
    });

    it("returns loss for -0.001%", () => {
      expect(getOutcomeTier(-0.001)).toBe("loss");
    });
  });

  describe("flat tier (>= 0% AND < 10%)", () => {
    it("returns flat for exactly 0%", () => {
      expect(getOutcomeTier(0)).toBe("flat");
    });

    it("returns flat for 0.01%", () => {
      expect(getOutcomeTier(0.01)).toBe("flat");
    });

    it("returns flat for 5%", () => {
      expect(getOutcomeTier(5)).toBe("flat");
    });

    it("returns flat for 9.99%", () => {
      expect(getOutcomeTier(9.99)).toBe("flat");
    });
  });

  describe("gain tier (>= 10% AND < 100%)", () => {
    it("returns gain for exactly 10%", () => {
      expect(getOutcomeTier(10)).toBe("gain");
    });

    it("returns gain for 10.01%", () => {
      expect(getOutcomeTier(10.01)).toBe("gain");
    });

    it("returns gain for 50%", () => {
      expect(getOutcomeTier(50)).toBe("gain");
    });

    it("returns gain for 99.99%", () => {
      expect(getOutcomeTier(99.99)).toBe("gain");
    });
  });

  describe("jackpot tier (>= 100%)", () => {
    it("returns jackpot for exactly 100%", () => {
      expect(getOutcomeTier(100)).toBe("jackpot");
    });

    it("returns jackpot for 100.01%", () => {
      expect(getOutcomeTier(100.01)).toBe("jackpot");
    });

    it("returns jackpot for 200%", () => {
      expect(getOutcomeTier(200)).toBe("jackpot");
    });

    it("returns jackpot for 1000%", () => {
      expect(getOutcomeTier(1000)).toBe("jackpot");
    });

    it("returns jackpot for extreme gain", () => {
      expect(getOutcomeTier(10000)).toBe("jackpot");
    });
  });

  describe("boundary conditions", () => {
    it("correctly classifies at -50% boundary (catastrophe/loss)", () => {
      expect(getOutcomeTier(-50.001)).toBe("catastrophe");
      expect(getOutcomeTier(-50)).toBe("loss");
      expect(getOutcomeTier(-49.999)).toBe("loss");
    });

    it("correctly classifies at 0% boundary (loss/flat)", () => {
      expect(getOutcomeTier(-0.001)).toBe("loss");
      expect(getOutcomeTier(0)).toBe("flat");
      expect(getOutcomeTier(0.001)).toBe("flat");
    });

    it("correctly classifies at 10% boundary (flat/gain)", () => {
      expect(getOutcomeTier(9.999)).toBe("flat");
      expect(getOutcomeTier(10)).toBe("gain");
      expect(getOutcomeTier(10.001)).toBe("gain");
    });

    it("correctly classifies at 100% boundary (gain/jackpot)", () => {
      expect(getOutcomeTier(99.999)).toBe("gain");
      expect(getOutcomeTier(100)).toBe("jackpot");
      expect(getOutcomeTier(100.001)).toBe("jackpot");
    });
  });

  describe("type safety", () => {
    it("returns valid OutcomeTier type", () => {
      const validTiers: OutcomeTier[] = [
        "catastrophe",
        "loss",
        "flat",
        "gain",
        "jackpot",
      ];

      const testValues = [-100, -50, -25, 0, 5, 10, 50, 100, 500];
      for (const value of testValues) {
        const tier = getOutcomeTier(value);
        expect(validTiers).toContain(tier);
      }
    });
  });
});

describe("getOutcomeTierBounds", () => {
  it("returns correct bounds for catastrophe", () => {
    const bounds = getOutcomeTierBounds("catastrophe");
    expect(bounds.min).toBe(-Infinity);
    expect(bounds.max).toBe(-50);
  });

  it("returns correct bounds for loss", () => {
    const bounds = getOutcomeTierBounds("loss");
    expect(bounds.min).toBe(-50);
    expect(bounds.max).toBe(0);
  });

  it("returns correct bounds for flat", () => {
    const bounds = getOutcomeTierBounds("flat");
    expect(bounds.min).toBe(0);
    expect(bounds.max).toBe(10);
  });

  it("returns correct bounds for gain", () => {
    const bounds = getOutcomeTierBounds("gain");
    expect(bounds.min).toBe(10);
    expect(bounds.max).toBe(100);
  });

  it("returns correct bounds for jackpot", () => {
    const bounds = getOutcomeTierBounds("jackpot");
    expect(bounds.min).toBe(100);
    expect(bounds.max).toBe(Infinity);
  });

  it("bounds are consistent with getOutcomeTier classification", () => {
    // For each tier, verify that a value in the middle of its bounds
    // is correctly classified by getOutcomeTier
    const tiers: OutcomeTier[] = ["catastrophe", "loss", "flat", "gain", "jackpot"];

    for (const tier of tiers) {
      const bounds = getOutcomeTierBounds(tier);
      // Calculate a mid-point value (handle infinity)
      let testValue: number;
      if (bounds.min === -Infinity) {
        testValue = bounds.max - 10; // e.g., -60 for catastrophe
      } else if (bounds.max === Infinity) {
        testValue = bounds.min + 100; // e.g., 200 for jackpot
      } else {
        testValue = (bounds.min + bounds.max) / 2;
      }

      expect(getOutcomeTier(testValue)).toBe(tier);
    }
  });

  it("bounds cover all possible values without gaps", () => {
    const tiers: OutcomeTier[] = ["catastrophe", "loss", "flat", "gain", "jackpot"];

    for (let i = 0; i < tiers.length - 1; i++) {
      const currentTier = tiers[i]!;
      const nextTier = tiers[i + 1]!;
      const currentBounds = getOutcomeTierBounds(currentTier);
      const nextBounds = getOutcomeTierBounds(nextTier);

      // The max of current tier should equal the min of next tier
      expect(currentBounds.max).toBe(nextBounds.min);
    }
  });
});

describe("integration with P&L calculation", () => {
  // Helper to simulate P&L percentage calculation
  function calculatePercentChange(pastPrice: number, currentPrice: number): number {
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }

  it("classifies complete stock loss as catastrophe", () => {
    // Stock went from $100 to $10 (-90%)
    const percent = calculatePercentChange(100, 10);
    expect(getOutcomeTier(percent)).toBe("catastrophe");
  });

  it("classifies halved stock as loss (boundary)", () => {
    // Stock went from $100 to $50 (-50%)
    const percent = calculatePercentChange(100, 50);
    expect(getOutcomeTier(percent)).toBe("loss");
  });

  it("classifies small loss as loss", () => {
    // Stock went from $100 to $80 (-20%)
    const percent = calculatePercentChange(100, 80);
    expect(getOutcomeTier(percent)).toBe("loss");
  });

  it("classifies no change as flat", () => {
    // Stock stayed at $100 (0%)
    const percent = calculatePercentChange(100, 100);
    expect(getOutcomeTier(percent)).toBe("flat");
  });

  it("classifies small gain as flat", () => {
    // Stock went from $100 to $105 (+5%)
    const percent = calculatePercentChange(100, 105);
    expect(getOutcomeTier(percent)).toBe("flat");
  });

  it("classifies 10% gain as gain (boundary)", () => {
    // Stock went from $100 to $110 (+10%)
    const percent = calculatePercentChange(100, 110);
    expect(getOutcomeTier(percent)).toBe("gain");
  });

  it("classifies significant gain as gain", () => {
    // Stock went from $100 to $175 (+75%)
    const percent = calculatePercentChange(100, 175);
    expect(getOutcomeTier(percent)).toBe("gain");
  });

  it("classifies doubled stock as jackpot (boundary)", () => {
    // Stock went from $100 to $200 (+100%)
    const percent = calculatePercentChange(100, 200);
    expect(getOutcomeTier(percent)).toBe("jackpot");
  });

  it("classifies multi-bagger as jackpot", () => {
    // Stock went from $100 to $1000 (+900%)
    const percent = calculatePercentChange(100, 1000);
    expect(getOutcomeTier(percent)).toBe("jackpot");
  });
});
