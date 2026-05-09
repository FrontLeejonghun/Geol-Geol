/**
 * OG Image Theme Configuration for satori/vercel-og Rendering
 *
 * Provides color palettes and styling for different outcome tiers
 * and themes (light/dark). Adapted for JSX-style inline styles.
 */

import type { OutcomeTier, Theme, Locale } from "@/types/stock";

// =============================================================================
// Types
// =============================================================================

export interface OgTheme {
  /** Background gradient colors (CSS linear-gradient compatible) */
  backgroundGradient: string;
  /** Primary text color (headline) */
  primaryText: string;
  /** Secondary text color (subline, labels) */
  secondaryText: string;
  /** Percentage text color */
  percentText: string;
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

const LIGHT_THEMES: Record<OutcomeTier, OgTheme> = {
  catastrophe: {
    backgroundGradient: "linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 50%, #FEFCE8 100%)",
    primaryText: "#B91C1C",
    secondaryText: "#DC2626",
    percentText: "#DC2626",
    badgeBg: "#FEE2E2",
    badgeText: "#B91C1C",
    mutedText: "#6B7280",
    borderColor: "#FECACA",
    cardBg: "rgba(255, 255, 255, 0.8)",
    icon: "\u{1F480}", // 💀
  },
  loss: {
    backgroundGradient: "linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 50%, #FEFCE8 100%)",
    primaryText: "#C2410C",
    secondaryText: "#EA580C",
    percentText: "#EA580C",
    badgeBg: "#FFEDD5",
    badgeText: "#C2410C",
    mutedText: "#6B7280",
    borderColor: "#FED7AA",
    cardBg: "rgba(255, 255, 255, 0.8)",
    icon: "\u{1F4C9}", // 📉
  },
  flat: {
    backgroundGradient: "linear-gradient(135deg, #F9FAFB 0%, #F8FAFC 50%, #F3F4F6 100%)",
    primaryText: "#374151",
    secondaryText: "#4B5563",
    percentText: "#4B5563",
    badgeBg: "#F3F4F6",
    badgeText: "#374151",
    mutedText: "#9CA3AF",
    borderColor: "#E5E7EB",
    cardBg: "rgba(255, 255, 255, 0.8)",
    icon: "\u{1F610}", // 😐
  },
  gain: {
    backgroundGradient: "linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 50%, #F0FDFA 100%)",
    primaryText: "#047857",
    secondaryText: "#059669",
    percentText: "#059669",
    badgeBg: "#D1FAE5",
    badgeText: "#047857",
    mutedText: "#6B7280",
    borderColor: "#A7F3D0",
    cardBg: "rgba(255, 255, 255, 0.8)",
    icon: "\u{1F4C8}", // 📈
  },
  jackpot: {
    backgroundGradient: "linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #ECFEFF 100%)",
    primaryText: "#15803D",
    secondaryText: "#16A34A",
    percentText: "#16A34A",
    badgeBg: "#DCFCE7",
    badgeText: "#15803D",
    mutedText: "#6B7280",
    borderColor: "#86EFAC",
    cardBg: "rgba(255, 255, 255, 0.85)",
    icon: "\u{1F680}", // 🚀
  },
};

const DARK_THEMES: Record<OutcomeTier, OgTheme> = {
  catastrophe: {
    backgroundGradient: "linear-gradient(135deg, #1C0A0A 0%, #1E1010 50%, #0F172A 100%)",
    primaryText: "#FCA5A5",
    secondaryText: "#F87171",
    percentText: "#F87171",
    badgeBg: "rgba(127, 29, 29, 0.5)",
    badgeText: "#FCA5A5",
    mutedText: "#9CA3AF",
    borderColor: "rgba(127, 29, 29, 0.5)",
    cardBg: "rgba(15, 23, 42, 0.6)",
    icon: "\u{1F480}", // 💀
  },
  loss: {
    backgroundGradient: "linear-gradient(135deg, #1C1007 0%, #1E1510 50%, #0F172A 100%)",
    primaryText: "#FDBA74",
    secondaryText: "#FB923C",
    percentText: "#FB923C",
    badgeBg: "rgba(124, 45, 18, 0.5)",
    badgeText: "#FDBA74",
    mutedText: "#9CA3AF",
    borderColor: "rgba(124, 45, 18, 0.5)",
    cardBg: "rgba(15, 23, 42, 0.6)",
    icon: "\u{1F4C9}", // 📉
  },
  flat: {
    backgroundGradient: "linear-gradient(135deg, #1E293B 0%, #1E293B 50%, #0F172A 100%)",
    primaryText: "#CBD5E1",
    secondaryText: "#94A3B8",
    percentText: "#94A3B8",
    badgeBg: "rgba(51, 65, 85, 0.5)",
    badgeText: "#CBD5E1",
    mutedText: "#64748B",
    borderColor: "rgba(51, 65, 85, 0.5)",
    cardBg: "rgba(15, 23, 42, 0.6)",
    icon: "\u{1F610}", // 😐
  },
  gain: {
    backgroundGradient: "linear-gradient(135deg, #052E16 0%, #082F23 50%, #0F172A 100%)",
    primaryText: "#6EE7B7",
    secondaryText: "#34D399",
    percentText: "#34D399",
    badgeBg: "rgba(6, 78, 59, 0.5)",
    badgeText: "#6EE7B7",
    mutedText: "#9CA3AF",
    borderColor: "rgba(6, 78, 59, 0.5)",
    cardBg: "rgba(15, 23, 42, 0.6)",
    icon: "\u{1F4C8}", // 📈
  },
  jackpot: {
    backgroundGradient: "linear-gradient(135deg, #052E16 0%, #022C22 50%, #0F172A 100%)",
    primaryText: "#86EFAC",
    secondaryText: "#4ADE80",
    percentText: "#4ADE80",
    badgeBg: "rgba(21, 128, 61, 0.5)",
    badgeText: "#86EFAC",
    mutedText: "#9CA3AF",
    borderColor: "rgba(21, 128, 61, 0.5)",
    cardBg: "rgba(15, 23, 42, 0.7)",
    icon: "\u{1F680}", // 🚀
  },
};

// =============================================================================
// Theme Accessor
// =============================================================================

/**
 * Get OG image theme for outcome tier and theme mode
 */
export function getOgTheme(outcomeTier: OutcomeTier, theme: Theme): OgTheme {
  return theme === "dark" ? DARK_THEMES[outcomeTier] : LIGHT_THEMES[outcomeTier];
}

// =============================================================================
// Outcome Labels (Reused from canvas themes)
// =============================================================================

const OUTCOME_LABELS: Record<Locale, Record<OutcomeTier, string>> = {
  ko: {
    catastrophe: "대참사",
    loss: "손실",
    flat: "보합",
    gain: "수익",
    jackpot: "대박",
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
export function getOgOutcomeLabel(outcomeTier: OutcomeTier, locale: Locale): string {
  return OUTCOME_LABELS[locale][outcomeTier];
}

// =============================================================================
// Branding Text
// =============================================================================

const BRANDING: Record<Locale, { title: string; tagline: string }> = {
  ko: {
    title: "꺻꺻",
    tagline: "그때 살꺻...",
  },
  en: {
    title: "GeolGeol",
    tagline: "Should've bought...",
  },
};

/**
 * Get branding text for locale
 */
export function getOgBrandingText(locale: Locale): { title: string; tagline: string } {
  return BRANDING[locale];
}
