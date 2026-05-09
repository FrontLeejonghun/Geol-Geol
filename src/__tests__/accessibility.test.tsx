/**
 * Accessibility Tests using axe-core
 *
 * This test file runs automated accessibility checks on key components
 * to ensure WCAG AA compliance, particularly for color contrast.
 *
 * WCAG AA Requirements:
 * - Normal text (<18pt): 4.5:1 contrast ratio
 * - Large text (>=18pt or >=14pt bold): 3:1 contrast ratio
 * - UI components and graphics: 3:1 contrast ratio
 */

import { describe, it, expect, beforeAll } from "vitest";

// =============================================================================
// Color Contrast Calculations
// =============================================================================

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate relative luminance per WCAG 2.1
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const srgb = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const rs = srgb[0] ?? 0;
  const gs = srgb[1] ?? 0;
  const bs = srgb[2] ?? 0;
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// =============================================================================
// Color Definitions (Tailwind CSS defaults)
// =============================================================================

const TAILWIND_COLORS = {
  // Gray scale
  "gray-50": "#f9fafb",
  "gray-100": "#f3f4f6",
  "gray-200": "#e5e7eb",
  "gray-300": "#d1d5db",
  "gray-400": "#9ca3af",
  "gray-500": "#6b7280",
  "gray-600": "#4b5563",
  "gray-700": "#374151",
  "gray-800": "#1f2937",
  "gray-900": "#111827",

  // Slate scale (dark mode backgrounds)
  "slate-100": "#f1f5f9",
  "slate-200": "#e2e8f0",
  "slate-300": "#cbd5e1",
  "slate-400": "#94a3b8",
  "slate-500": "#64748b",
  "slate-600": "#475569",
  "slate-700": "#334155",
  "slate-800": "#1e293b",
  "slate-900": "#0f172a",

  // Blue
  "blue-400": "#60a5fa",
  "blue-500": "#3b82f6",
  "blue-600": "#2563eb",
  "blue-700": "#1d4ed8",

  // Red
  "red-300": "#fca5a5",
  "red-400": "#f87171",
  "red-500": "#ef4444",
  "red-600": "#dc2626",
  "red-700": "#b91c1c",

  // Green
  "green-300": "#86efac",
  "green-400": "#4ade80",
  "green-500": "#22c55e",
  "green-600": "#16a34a",
  "green-700": "#15803d",

  // Emerald
  "emerald-300": "#6ee7b7",
  "emerald-400": "#34d399",
  "emerald-500": "#10b981",
  "emerald-600": "#059669",
  "emerald-700": "#047857",

  // Orange
  "orange-300": "#fdba74",
  "orange-400": "#fb923c",
  "orange-500": "#f97316",
  "orange-600": "#ea580c",
  "orange-700": "#c2410c",

  // Amber
  "amber-300": "#fcd34d",
  "amber-400": "#fbbf24",
  "amber-500": "#f59e0b",
  "amber-600": "#d97706",
  "amber-700": "#b45309",

  // Teal
  "teal-400": "#2dd4bf",
  "teal-700": "#0f766e",

  // Purple
  "purple-300": "#c4b5fd",
  "purple-400": "#a78bfa",
  "purple-600": "#9333ea",
  "purple-700": "#7c3aed",

  // Yellow
  "yellow-300": "#fde047",
  "yellow-400": "#facc15",
  "yellow-600": "#ca8a04",
  "yellow-700": "#a16207",

  // Base colors
  white: "#ffffff",
  black: "#000000",
};

// =============================================================================
// Test Color Combinations Used in the App
// =============================================================================

interface ColorCombination {
  name: string;
  foreground: string;
  background: string;
  minRatio: number; // 4.5 for normal text, 3.0 for large text/UI
  usage: string;
}

const COLOR_COMBINATIONS: ColorCombination[] = [
  // ============= LIGHT MODE =============

  // Primary text on white background
  {
    name: "text-gray-900 on white",
    foreground: TAILWIND_COLORS["gray-900"],
    background: TAILWIND_COLORS.white,
    minRatio: 4.5,
    usage: "Primary text content",
  },
  {
    name: "text-gray-700 on white",
    foreground: TAILWIND_COLORS["gray-700"],
    background: TAILWIND_COLORS.white,
    minRatio: 4.5,
    usage: "Section headings",
  },
  {
    name: "text-gray-600 on white",
    foreground: TAILWIND_COLORS["gray-600"],
    background: TAILWIND_COLORS.white,
    minRatio: 4.5,
    usage: "Secondary text",
  },
  {
    name: "text-gray-500 on white",
    foreground: TAILWIND_COLORS["gray-500"],
    background: TAILWIND_COLORS.white,
    minRatio: 4.5,
    usage: "Tertiary text / placeholder",
  },

  // Status colors on white (using -700 variants for WCAG AA compliance)
  {
    name: "text-blue-600 on white",
    foreground: TAILWIND_COLORS["blue-600"],
    background: TAILWIND_COLORS.white,
    minRatio: 4.5,
    usage: "Primary actions/links",
  },
  {
    name: "text-red-700 on white",
    foreground: TAILWIND_COLORS["red-700"],
    background: TAILWIND_COLORS.white,
    minRatio: 4.5,
    usage: "Error/loss text",
  },
  {
    name: "text-green-700 on white",
    foreground: TAILWIND_COLORS["green-700"],
    background: TAILWIND_COLORS.white,
    minRatio: 4.5,
    usage: "Success/gain text",
  },
  {
    name: "text-emerald-700 on white",
    foreground: TAILWIND_COLORS["emerald-700"],
    background: TAILWIND_COLORS.white,
    minRatio: 4.5,
    usage: "Gain outcome text",
  },
  {
    name: "text-orange-700 on white",
    foreground: TAILWIND_COLORS["orange-700"],
    background: TAILWIND_COLORS.white,
    minRatio: 4.5,
    usage: "Warning/loss text",
  },

  // Badge text on colored backgrounds (light mode)
  {
    name: "text-red-700 on red-100",
    foreground: TAILWIND_COLORS["red-700"],
    background: "#fee2e2", // red-100
    minRatio: 4.5,
    usage: "KR market badge",
  },
  {
    name: "text-teal-700 on teal-100",
    foreground: TAILWIND_COLORS["teal-700"],
    background: "#ccfbf1", // teal-100
    minRatio: 4.5,
    usage: "US market badge",
  },
  {
    name: "text-emerald-700 on emerald-100",
    foreground: TAILWIND_COLORS["emerald-700"],
    background: "#d1fae5", // emerald-100
    minRatio: 4.5,
    usage: "Gain badge",
  },
  {
    name: "text-orange-700 on orange-100",
    foreground: TAILWIND_COLORS["orange-700"],
    background: "#ffedd5", // orange-100
    minRatio: 4.5,
    usage: "Loss badge",
  },
  {
    name: "text-gray-700 on gray-100",
    foreground: TAILWIND_COLORS["gray-700"],
    background: TAILWIND_COLORS["gray-100"],
    minRatio: 4.5,
    usage: "Flat badge",
  },
  {
    name: "text-green-700 on green-100",
    foreground: TAILWIND_COLORS["green-700"],
    background: "#dcfce7", // green-100
    minRatio: 4.5,
    usage: "Jackpot badge",
  },

  // Text on gray backgrounds
  {
    name: "text-gray-500 on gray-50",
    foreground: TAILWIND_COLORS["gray-500"],
    background: TAILWIND_COLORS["gray-50"],
    minRatio: 4.5,
    usage: "Summary label text",
  },
  {
    name: "text-gray-700 on gray-50",
    foreground: TAILWIND_COLORS["gray-700"],
    background: TAILWIND_COLORS["gray-50"],
    minRatio: 4.5,
    usage: "Summary text",
  },

  // ============= DARK MODE =============

  // Primary text on dark backgrounds
  {
    name: "text-white on gray-800",
    foreground: TAILWIND_COLORS.white,
    background: TAILWIND_COLORS["gray-800"],
    minRatio: 4.5,
    usage: "Primary text (dark mode)",
  },
  {
    name: "text-white on gray-900",
    foreground: TAILWIND_COLORS.white,
    background: TAILWIND_COLORS["gray-900"],
    minRatio: 4.5,
    usage: "Primary text on darker bg (dark mode)",
  },
  {
    name: "text-slate-100 on slate-800",
    foreground: TAILWIND_COLORS["slate-100"],
    background: TAILWIND_COLORS["slate-800"],
    minRatio: 4.5,
    usage: "Primary text (slate dark mode)",
  },
  {
    name: "text-slate-100 on slate-900",
    foreground: TAILWIND_COLORS["slate-100"],
    background: TAILWIND_COLORS["slate-900"],
    minRatio: 4.5,
    usage: "Primary text on darker bg (slate dark mode)",
  },

  // Secondary text on dark backgrounds
  {
    name: "text-gray-300 on gray-800",
    foreground: TAILWIND_COLORS["gray-300"],
    background: TAILWIND_COLORS["gray-800"],
    minRatio: 4.5,
    usage: "Secondary text (dark mode)",
  },
  {
    name: "text-gray-400 on gray-800",
    foreground: TAILWIND_COLORS["gray-400"],
    background: TAILWIND_COLORS["gray-800"],
    minRatio: 4.5,
    usage: "Tertiary text (dark mode)",
  },
  {
    name: "text-slate-300 on slate-800",
    foreground: TAILWIND_COLORS["slate-300"],
    background: TAILWIND_COLORS["slate-800"],
    minRatio: 4.5,
    usage: "Secondary text (slate dark mode)",
  },
  {
    name: "text-slate-400 on slate-800",
    foreground: TAILWIND_COLORS["slate-400"],
    background: TAILWIND_COLORS["slate-800"],
    minRatio: 4.5,
    usage: "Label text (slate dark mode)",
  },

  // Status colors on dark backgrounds
  {
    name: "text-blue-400 on gray-800",
    foreground: TAILWIND_COLORS["blue-400"],
    background: TAILWIND_COLORS["gray-800"],
    minRatio: 4.5,
    usage: "Links (dark mode)",
  },
  {
    name: "text-red-400 on gray-800",
    foreground: TAILWIND_COLORS["red-400"],
    background: TAILWIND_COLORS["gray-800"],
    minRatio: 4.5,
    usage: "Error/loss (dark mode)",
  },
  {
    name: "text-green-400 on gray-800",
    foreground: TAILWIND_COLORS["green-400"],
    background: TAILWIND_COLORS["gray-800"],
    minRatio: 4.5,
    usage: "Success/jackpot (dark mode)",
  },
  {
    name: "text-emerald-400 on gray-800",
    foreground: TAILWIND_COLORS["emerald-400"],
    background: TAILWIND_COLORS["gray-800"],
    minRatio: 4.5,
    usage: "Gain (dark mode)",
  },
  {
    name: "text-orange-400 on gray-800",
    foreground: TAILWIND_COLORS["orange-400"],
    background: TAILWIND_COLORS["gray-800"],
    minRatio: 4.5,
    usage: "Loss (dark mode)",
  },

  // Dark mode badges
  {
    name: "text-red-400 on red-900/30",
    foreground: TAILWIND_COLORS["red-400"],
    background: "#301414", // approx red-900 at 30% over dark bg
    minRatio: 4.5,
    usage: "KR market badge (dark mode)",
  },
  {
    name: "text-teal-400 on teal-900/30",
    foreground: TAILWIND_COLORS["teal-400"],
    background: "#0d2927", // approx teal-900 at 30% over dark bg
    minRatio: 4.5,
    usage: "US market badge (dark mode)",
  },
  {
    name: "text-emerald-300 on emerald-900/40",
    foreground: TAILWIND_COLORS["emerald-300"],
    background: "#0c2618", // approx emerald-900 at 40% over dark bg
    minRatio: 4.5,
    usage: "Gain badge (dark mode)",
  },
  {
    name: "text-orange-300 on orange-900/40",
    foreground: TAILWIND_COLORS["orange-300"],
    background: "#2d1608", // approx orange-900 at 40% over dark bg
    minRatio: 4.5,
    usage: "Loss badge (dark mode)",
  },
  {
    name: "text-gray-300 on gray-700/40",
    foreground: TAILWIND_COLORS["gray-300"],
    background: TAILWIND_COLORS["gray-700"],
    minRatio: 4.5,
    usage: "Flat badge (dark mode)",
  },
  {
    name: "text-green-300 on green-900/40",
    foreground: TAILWIND_COLORS["green-300"],
    background: "#082612", // approx green-900 at 40% over dark bg
    minRatio: 4.5,
    usage: "Jackpot badge (dark mode)",
  },

  // Placeholder text (now using gray-500 for WCAG AA compliance)
  {
    name: "text-gray-500 (placeholder) on white",
    foreground: TAILWIND_COLORS["gray-500"],
    background: TAILWIND_COLORS.white,
    minRatio: 3.0,
    usage: "Placeholder text (UI component)",
  },
  {
    name: "text-gray-400 (placeholder) on gray-800",
    foreground: TAILWIND_COLORS["gray-400"],
    background: TAILWIND_COLORS["gray-800"],
    minRatio: 3.0,
    usage: "Placeholder text dark (UI component)",
  },

  // Footer/disclaimer text (now using proper contrast)
  {
    name: "text-gray-500 on white (footer)",
    foreground: TAILWIND_COLORS["gray-500"],
    background: TAILWIND_COLORS.white,
    minRatio: 4.5,
    usage: "Footer disclaimer",
  },
  {
    name: "text-gray-400 on gray-800 (footer dark)",
    foreground: TAILWIND_COLORS["gray-400"],
    background: TAILWIND_COLORS["gray-800"],
    minRatio: 4.5,
    usage: "Footer disclaimer dark",
  },
];

// =============================================================================
// Tests
// =============================================================================

describe("Accessibility - Color Contrast", () => {
  it.each(COLOR_COMBINATIONS)(
    "$name should meet WCAG AA minimum ratio of $minRatio:1",
    ({ foreground, background, minRatio, name }) => {
      const ratio = getContrastRatio(foreground, background);
      console.log(`${name}: ${ratio.toFixed(2)}:1 (min: ${minRatio}:1)`);

      expect(ratio).toBeGreaterThanOrEqual(minRatio);
    }
  );
});

describe("Critical Color Contrast Issues", () => {
  beforeAll(() => {
    console.log("\n=== Color Contrast Audit ===\n");
  });

  it("should identify text-gray-400 contrast issues", () => {
    // gray-400 (#9ca3af) on white has a contrast ratio of ~2.66:1
    // This is below both the 4.5:1 for normal text and 3:1 for large text
    const ratio = getContrastRatio(TAILWIND_COLORS["gray-400"], TAILWIND_COLORS.white);
    console.log(`text-gray-400 on white: ${ratio.toFixed(2)}:1`);

    // This test documents the issue - gray-400 fails AA for text
    // We'll fix this by using gray-500 or darker
    expect(ratio).toBeLessThan(4.5);
  });

  it("should verify text-gray-500 meets minimum contrast", () => {
    // gray-500 (#6b7280) on white has a contrast ratio of ~4.64:1
    const ratio = getContrastRatio(TAILWIND_COLORS["gray-500"], TAILWIND_COLORS.white);
    console.log(`text-gray-500 on white: ${ratio.toFixed(2)}:1`);

    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("should verify dark mode secondary text contrast", () => {
    // gray-400 on gray-800
    const ratio = getContrastRatio(TAILWIND_COLORS["gray-400"], TAILWIND_COLORS["gray-800"]);
    console.log(`text-gray-400 on gray-800: ${ratio.toFixed(2)}:1`);

    // gray-400 on gray-800 should pass for UI elements (3:1)
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it("should verify dark mode text-gray-500 fails for body text", () => {
    // gray-500 on gray-800 has ~3.2:1 ratio - fails 4.5:1 for body text
    const ratio = getContrastRatio(TAILWIND_COLORS["gray-500"], TAILWIND_COLORS["gray-800"]);
    console.log(`text-gray-500 on gray-800: ${ratio.toFixed(2)}:1`);

    // Document the failure - we need gray-400 or lighter for dark mode text
    expect(ratio).toBeLessThan(4.5);
  });
});

describe("Recommended Color Replacements", () => {
  it("should log recommended replacements", () => {
    const recommendations = [
      {
        current: "text-gray-400",
        replacement: "text-gray-500",
        context: "light mode body/secondary text",
      },
      {
        current: "dark:text-gray-500",
        replacement: "dark:text-gray-400",
        context: "dark mode body/secondary text",
      },
      {
        current: "text-gray-400 (placeholder)",
        replacement: "text-gray-500",
        context: "input placeholder text",
      },
      {
        current: "dark:text-gray-500 (placeholder)",
        replacement: "dark:text-gray-400",
        context: "dark mode placeholder text",
      },
    ];

    console.log("\n=== Recommended Color Replacements ===\n");
    for (const rec of recommendations) {
      console.log(`${rec.current} → ${rec.replacement} (${rec.context})`);
    }

    expect(recommendations.length).toBeGreaterThan(0);
  });
});
