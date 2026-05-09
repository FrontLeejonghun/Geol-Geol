/**
 * Canvas Theme Configuration for Share Image Rendering
 *
 * Provides color palettes and styling configuration for
 * different outcome tiers and themes (light/dark).
 */

import type { OutcomeTier, Theme, Locale } from "@/types/stock";

// =============================================================================
// Types
// =============================================================================

export interface CanvasTheme {
  /** Background gradient colors [start, middle, end] */
  gradient: [string, string, string];
  /** Primary text color (headline) */
  primaryText: string;
  /** Secondary text color (subline, labels) */
  secondaryText: string;
  /** Percentage text color */
  percentText: string;
  /** Chart line color */
  chartLine: string;
  /** Chart fill gradient [start, end] */
  chartFill: [string, string];
  /** Buy marker dot color */
  markerColor: string;
  /** Badge background color */
  badgeBg: string;
  /** Badge text color */
  badgeText: string;
  /** Muted text color (dates, small labels) */
  mutedText: string;
  /** Border color for panels */
  borderColor: string;
  /** Card/panel background */
  cardBg: string;
  /** Icon/emoji for outcome tier */
  icon: string;
}

// =============================================================================
// Theme Palettes
// =============================================================================

// Neutral on-screen palette mapped to the share image. Only `percentText`
// and `chartLine` differ by direction (red for loss, green for gain) —
// everything else is the same shadcn-style card surface.
const NEUTRAL_BASE = {
  gradient: ["#FFFFFF", "#FFFFFF", "#FFFFFF"] as [string, string, string],
  primaryText: "#0A0A0A", // foreground (oklch 0.145 0 0 ≈ #0A0A0A)
  secondaryText: "#6B7280", // muted-foreground
  mutedText: "#9CA3AF",
  badgeBg: "#F4F4F5", // muted
  badgeText: "#52525B",
  borderColor: "#E5E5E5", // border
  cardBg: "#FFFFFF",
};

const NEG_RED = "#DC2626"; // tailwind red-600
const POS_GREEN = "#059669"; // tailwind emerald-600
const FLAT_GRAY = "#0A0A0A"; // foreground

const NEG_FILL: [string, string] = [
  "rgba(220, 38, 38, 0.18)",
  "rgba(220, 38, 38, 0.02)",
];
const POS_FILL: [string, string] = [
  "rgba(5, 150, 105, 0.18)",
  "rgba(5, 150, 105, 0.02)",
];
const NEU_FILL: [string, string] = [
  "rgba(107, 114, 128, 0.14)",
  "rgba(107, 114, 128, 0.02)",
];

const LIGHT_THEMES: Record<OutcomeTier, CanvasTheme> = {
  catastrophe: {
    ...NEUTRAL_BASE,
    percentText: NEG_RED,
    chartLine: NEG_RED,
    chartFill: NEG_FILL,
    markerColor: NEG_RED,
    icon: "\u{1F480}",
  },
  loss: {
    ...NEUTRAL_BASE,
    percentText: NEG_RED,
    chartLine: NEG_RED,
    chartFill: NEG_FILL,
    markerColor: NEG_RED,
    icon: "\u{1F4C9}",
  },
  flat: {
    ...NEUTRAL_BASE,
    percentText: FLAT_GRAY,
    chartLine: "#6B7280",
    chartFill: NEU_FILL,
    markerColor: "#6B7280",
    icon: "\u{1F610}",
  },
  gain: {
    ...NEUTRAL_BASE,
    percentText: POS_GREEN,
    chartLine: POS_GREEN,
    chartFill: POS_FILL,
    markerColor: POS_GREEN,
    icon: "\u{1F4C8}",
  },
  jackpot: {
    ...NEUTRAL_BASE,
    percentText: POS_GREEN,
    chartLine: POS_GREEN,
    chartFill: POS_FILL,
    markerColor: POS_GREEN,
    icon: "\u{1F680}",
  },
};

// Dark mode is disabled in the on-screen UI; mirror light to keep
// share-image output identical regardless of `theme` prop.
const DARK_THEMES = LIGHT_THEMES;

// =============================================================================
// Theme Accessor
// =============================================================================

/**
 * Get canvas theme for outcome tier and theme mode
 */
export function getCanvasTheme(
  outcomeTier: OutcomeTier,
  theme: Theme
): CanvasTheme {
  return theme === "dark" ? DARK_THEMES[outcomeTier] : LIGHT_THEMES[outcomeTier];
}

// =============================================================================
// Outcome Labels
// =============================================================================

const OUTCOME_LABELS: Record<Locale, Record<OutcomeTier, string>> = {
  ko: {
    catastrophe: "대참사", // 대참사
    loss: "손실", // 손실
    flat: "보합", // 보합
    gain: "수익", // 수익
    jackpot: "대박", // 대박
  },
  en: {
    catastrophe: "Disaster",
    loss: "Loss",
    flat: "Flat",
    gain: "Gain",
    jackpot: "Jackpot",
  },
};

/**
 * Get outcome label for locale
 */
export function getOutcomeLabel(
  outcomeTier: OutcomeTier,
  locale: Locale
): string {
  return OUTCOME_LABELS[locale][outcomeTier];
}

// =============================================================================
// Branding Text
// =============================================================================

const BRANDING: Record<Locale, { title: string; tagline: string }> = {
  ko: {
    title: "껄껄",
    tagline: "그때 살껄...",
  },
  en: {
    title: "GeolGeol",
    tagline: "Should've bought...",
  },
};

/**
 * Get branding text for locale
 */
export function getBrandingText(
  locale: Locale
): { title: string; tagline: string } {
  return BRANDING[locale];
}
