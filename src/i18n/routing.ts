import { defineRouting } from "next-intl/routing";

/**
 * Supported locales for GeolGeol
 * - ko: Korean (default)
 * - en: English
 */
export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";

/**
 * Locale cookie name used by next-intl middleware
 * This cookie persists the user's locale preference
 */
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/**
 * next-intl routing configuration
 *
 * Features:
 * - URL-based locale routing (/ko, /en)
 * - Accept-Language header detection on first visit
 * - Cookie-based persistence of locale preference
 * - Path rewriting for clean URLs
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  // Use prefix for all locales for consistent routing
  // This makes URLs like /ko/result and /en/result
  // Note: Requires [locale] folder structure in src/app/ to work properly
  localePrefix: "always",
  // Enable locale detection from Accept-Language header
  localeDetection: true,
});
