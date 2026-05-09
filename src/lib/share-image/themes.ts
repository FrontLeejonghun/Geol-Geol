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

const LIGHT_THEMES: Record<OutcomeTier, CanvasTheme> = {
  catastrophe: {
    gradient: ["#FEF2F2", "#FFF7ED", "#FEFCE8"],
    primaryText: "#B91C1C",
    secondaryText: "#DC2626",
    percentText: "#DC2626",
    chartLine: "#EF4444",
    chartFill: ["rgba(239, 68, 68, 0.3)", "rgba(239, 68, 68, 0.05)"],
    markerColor: "#DC2626",
    badgeBg: "#FEE2E2",
    badgeText: "#B91C1C",
    mutedText: "#6B7280",
    borderColor: "#FECACA",
    cardBg: "rgba(255, 255, 255, 0.7)",
    icon: "\u{1F480}", // 💀
  },
  loss: {
    gradient: ["#FFF7ED", "#FFFBEB", "#FEFCE8"],
    primaryText: "#C2410C",
    secondaryText: "#EA580C",
    percentText: "#EA580C",
    chartLine: "#F97316",
    chartFill: ["rgba(249, 115, 22, 0.3)", "rgba(249, 115, 22, 0.05)"],
    markerColor: "#EA580C",
    badgeBg: "#FFEDD5",
    badgeText: "#C2410C",
    mutedText: "#6B7280",
    borderColor: "#FED7AA",
    cardBg: "rgba(255, 255, 255, 0.7)",
    icon: "\u{1F4C9}", // 📉
  },
  flat: {
    gradient: ["#F9FAFB", "#F8FAFC", "#F3F4F6"],
    primaryText: "#374151",
    secondaryText: "#4B5563",
    percentText: "#4B5563",
    chartLine: "#6B7280",
    chartFill: ["rgba(107, 114, 128, 0.2)", "rgba(107, 114, 128, 0.05)"],
    markerColor: "#6B7280",
    badgeBg: "#F3F4F6",
    badgeText: "#374151",
    mutedText: "#9CA3AF",
    borderColor: "#E5E7EB",
    cardBg: "rgba(255, 255, 255, 0.7)",
    icon: "\u{1F610}", // 😐
  },
  gain: {
    gradient: ["#ECFDF5", "#F0FDF4", "#F0FDFA"],
    primaryText: "#047857",
    secondaryText: "#059669",
    percentText: "#059669",
    chartLine: "#10B981",
    chartFill: ["rgba(16, 185, 129, 0.3)", "rgba(16, 185, 129, 0.05)"],
    markerColor: "#059669",
    badgeBg: "#D1FAE5",
    badgeText: "#047857",
    mutedText: "#6B7280",
    borderColor: "#A7F3D0",
    cardBg: "rgba(255, 255, 255, 0.7)",
    icon: "\u{1F4C8}", // 📈
  },
  jackpot: {
    gradient: ["#F0FDF4", "#ECFDF5", "#ECFEFF"],
    primaryText: "#15803D",
    secondaryText: "#16A34A",
    percentText: "#16A34A",
    chartLine: "#22C55E",
    chartFill: ["rgba(34, 197, 94, 0.35)", "rgba(34, 197, 94, 0.05)"],
    markerColor: "#16A34A",
    badgeBg: "#DCFCE7",
    badgeText: "#15803D",
    mutedText: "#6B7280",
    borderColor: "#86EFAC",
    cardBg: "rgba(255, 255, 255, 0.8)",
    icon: "\u{1F680}", // 🚀
  },
};

const DARK_THEMES: Record<OutcomeTier, CanvasTheme> = {
  catastrophe: {
    gradient: ["#1C0A0A", "#1E1010", "#0F172A"],
    primaryText: "#FCA5A5",
    secondaryText: "#F87171",
    percentText: "#F87171",
    chartLine: "#EF4444",
    chartFill: ["rgba(239, 68, 68, 0.4)", "rgba(239, 68, 68, 0.05)"],
    markerColor: "#F87171",
    badgeBg: "rgba(127, 29, 29, 0.5)",
    badgeText: "#FCA5A5",
    mutedText: "#9CA3AF",
    borderColor: "rgba(127, 29, 29, 0.5)",
    cardBg: "rgba(15, 23, 42, 0.6)",
    icon: "\u{1F480}", // 💀
  },
  loss: {
    gradient: ["#1C1007", "#1E1510", "#0F172A"],
    primaryText: "#FDBA74",
    secondaryText: "#FB923C",
    percentText: "#FB923C",
    chartLine: "#F97316",
    chartFill: ["rgba(249, 115, 22, 0.4)", "rgba(249, 115, 22, 0.05)"],
    markerColor: "#FB923C",
    badgeBg: "rgba(124, 45, 18, 0.5)",
    badgeText: "#FDBA74",
    mutedText: "#9CA3AF",
    borderColor: "rgba(124, 45, 18, 0.5)",
    cardBg: "rgba(15, 23, 42, 0.6)",
    icon: "\u{1F4C9}", // 📉
  },
  flat: {
    gradient: ["#1E293B", "#1E293B", "#0F172A"],
    primaryText: "#CBD5E1",
    secondaryText: "#94A3B8",
    percentText: "#94A3B8",
    chartLine: "#64748B",
    chartFill: ["rgba(100, 116, 139, 0.3)", "rgba(100, 116, 139, 0.05)"],
    markerColor: "#94A3B8",
    badgeBg: "rgba(51, 65, 85, 0.5)",
    badgeText: "#CBD5E1",
    mutedText: "#64748B",
    borderColor: "rgba(51, 65, 85, 0.5)",
    cardBg: "rgba(15, 23, 42, 0.6)",
    icon: "\u{1F610}", // 😐
  },
  gain: {
    gradient: ["#052E16", "#082F23", "#0F172A"],
    primaryText: "#6EE7B7",
    secondaryText: "#34D399",
    percentText: "#34D399",
    chartLine: "#10B981",
    chartFill: ["rgba(16, 185, 129, 0.4)", "rgba(16, 185, 129, 0.05)"],
    markerColor: "#34D399",
    badgeBg: "rgba(6, 78, 59, 0.5)",
    badgeText: "#6EE7B7",
    mutedText: "#9CA3AF",
    borderColor: "rgba(6, 78, 59, 0.5)",
    cardBg: "rgba(15, 23, 42, 0.6)",
    icon: "\u{1F4C8}", // 📈
  },
  jackpot: {
    gradient: ["#052E16", "#022C22", "#0F172A"],
    primaryText: "#86EFAC",
    secondaryText: "#4ADE80",
    percentText: "#4ADE80",
    chartLine: "#22C55E",
    chartFill: ["rgba(34, 197, 94, 0.45)", "rgba(34, 197, 94, 0.05)"],
    markerColor: "#4ADE80",
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
