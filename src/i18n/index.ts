/**
 * i18n configuration for GeolGeol
 *
 * This module exports:
 * - routing: Locale configuration (supported locales, default locale)
 * - navigation: Locale-aware navigation helpers (Link, redirect, usePathname, etc.)
 * - LOCALE_COOKIE_NAME: Cookie name used for locale persistence
 * - Type-safe navigation utilities and helpers
 */

// Routing configuration
export {
  routing,
  locales,
  defaultLocale,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "./routing";

// Navigation components and hooks
export {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} from "./navigation";

// Type exports for navigation
export type {
  LinkProps,
  AppRouter,
  AppHref,
  AppRoutePath,
} from "./navigation";

// Navigation utilities
export {
  AppRoutes,
  createLocalePath,
  buildResultUrl,
  parseResultParams,
  isValidLocale,
  extractLocaleFromPath,
  stripLocaleFromPath,
} from "./navigation";
