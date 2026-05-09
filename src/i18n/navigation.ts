import { createNavigation } from "next-intl/navigation";
import type { ComponentProps } from "react";
import { routing, type Locale, locales, defaultLocale } from "./routing";

// =============================================================================
// Core Navigation Exports
// =============================================================================

/**
 * Type-safe navigation helpers created from the routing configuration.
 *
 * These exports wrap Next.js navigation primitives with locale awareness:
 * - Link: Locale-aware <a> component (use instead of next/link)
 * - redirect: Server-side redirect with locale prefix
 * - usePathname: Returns pathname without locale prefix
 * - useRouter: Router with locale-aware navigation methods
 * - getPathname: Get pathname for a given href and locale
 *
 * @example
 * ```tsx
 * // In a component
 * import { Link, usePathname, useRouter } from '@/i18n/navigation';
 *
 * // Link automatically handles locale prefixing
 * <Link href="/result">Go to result</Link>
 *
 * // usePathname returns path without locale prefix
 * const pathname = usePathname(); // '/result' not '/ko/result'
 *
 * // useRouter provides locale-aware navigation
 * const router = useRouter();
 * router.push('/result'); // navigates to /{locale}/result
 * ```
 */
const navigation = createNavigation(routing);

export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = navigation;

// =============================================================================
// Type Exports
// =============================================================================

/**
 * Props type for the locale-aware Link component.
 * Extends the underlying anchor props with href handling.
 *
 * @example
 * ```tsx
 * const linkProps: LinkProps = {
 *   href: '/result',
 *   locale: 'ko',
 *   className: 'my-link'
 * };
 * ```
 */
export type LinkProps = ComponentProps<typeof Link>;

/**
 * Return type of the useRouter hook.
 * Provides locale-aware navigation methods.
 *
 * @example
 * ```tsx
 * const router: AppRouter = useRouter();
 * router.push('/result');
 * router.replace('/');
 * router.prefetch('/result');
 * ```
 */
export type AppRouter = ReturnType<typeof useRouter>;

/**
 * Valid href values for navigation.
 * Can be a string path or an object with pathname and params.
 *
 * @example
 * ```tsx
 * // String href
 * const href1: AppHref = '/result';
 *
 * // Object href with query params
 * const href2: AppHref = {
 *   pathname: '/result',
 *   query: { ticker: 'AAPL', date: '2023-01-01' }
 * };
 * ```
 */
export type AppHref = LinkProps["href"];

// =============================================================================
// Application Routes (Type-Safe Pathnames)
// =============================================================================

/**
 * Known application routes for type-safe navigation.
 * Add new routes here as the application grows.
 */
export const AppRoutes = {
  /** Home page - stock selection */
  home: "/" as const,
  /** Result page - P&L visualization */
  result: "/result" as const,
} as const;

/**
 * Type representing valid application route paths.
 */
export type AppRoutePath = (typeof AppRoutes)[keyof typeof AppRoutes];

// =============================================================================
// Navigation Utilities
// =============================================================================

/**
 * Creates a locale-prefixed URL path.
 * Useful for programmatic navigation or external links.
 *
 * @param pathname - The path without locale prefix
 * @param locale - Target locale (defaults to 'ko')
 * @returns Full path with locale prefix
 *
 * @example
 * ```ts
 * createLocalePath('/result', 'en'); // '/en/result'
 * createLocalePath('/'); // '/ko'
 * ```
 */
export function createLocalePath(
  pathname: string,
  locale: Locale = defaultLocale
): string {
  // Normalize pathname to ensure it starts with /
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  // Handle root path
  if (normalizedPath === "/") {
    return `/${locale}`;
  }

  return `/${locale}${normalizedPath}`;
}

/**
 * Builds a URL with query parameters for the result page.
 * Encodes all parameters properly for safe URL usage.
 *
 * @param params - Result page parameters
 * @returns URL path with encoded query string
 *
 * @example
 * ```ts
 * buildResultUrl({
 *   ticker: 'AAPL',
 *   date: '2023-01-15',
 *   amount: 10000
 * });
 * // Returns: '/result?ticker=AAPL&date=2023-01-15&amount=10000'
 * ```
 */
export function buildResultUrl(params: {
  ticker: string;
  date: string;
  amount?: number;
}): string {
  const searchParams = new URLSearchParams();
  searchParams.set("ticker", params.ticker);
  searchParams.set("date", params.date);
  if (params.amount !== undefined) {
    searchParams.set("amount", params.amount.toString());
  }
  return `${AppRoutes.result}?${searchParams.toString()}`;
}

/**
 * Parses result URL parameters from a URL search params object.
 * Returns null if required parameters are missing.
 *
 * @param searchParams - URLSearchParams or plain object
 * @returns Parsed parameters or null if invalid
 *
 * @example
 * ```ts
 * const params = parseResultParams(new URLSearchParams('?ticker=AAPL&date=2023-01-15'));
 * // { ticker: 'AAPL', date: '2023-01-15', amount: undefined }
 * ```
 */
export function parseResultParams(
  searchParams: URLSearchParams | Record<string, string | undefined>
): { ticker: string; date: string; amount?: number } | null {
  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined;
    }
    return searchParams[key];
  };

  const ticker = get("ticker");
  const date = get("date");

  if (!ticker || !date) {
    return null;
  }

  const amountStr = get("amount");
  const amount = amountStr ? Number(amountStr) : undefined;

  return {
    ticker,
    date,
    amount: amount && !Number.isNaN(amount) ? amount : undefined,
  };
}

/**
 * Checks if a given locale string is a valid supported locale.
 * Type guard for narrowing string to Locale type.
 *
 * @param locale - String to check
 * @returns True if locale is valid, with type narrowing
 *
 * @example
 * ```ts
 * const maybeLocale: string = 'ko';
 * if (isValidLocale(maybeLocale)) {
 *   // maybeLocale is now typed as Locale
 *   const path = createLocalePath('/result', maybeLocale);
 * }
 * ```
 */
export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}

/**
 * Extracts locale from a pathname.
 * Returns the locale if found, otherwise returns the default locale.
 *
 * @param pathname - Full pathname possibly with locale prefix
 * @returns The extracted locale or default locale
 *
 * @example
 * ```ts
 * extractLocaleFromPath('/ko/result'); // 'ko'
 * extractLocaleFromPath('/en/result'); // 'en'
 * extractLocaleFromPath('/result'); // 'ko' (default)
 * ```
 */
export function extractLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && isValidLocale(firstSegment)) {
    return firstSegment;
  }

  return defaultLocale;
}

/**
 * Removes locale prefix from a pathname.
 * Useful for getting the canonical path without locale.
 *
 * @param pathname - Full pathname with possible locale prefix
 * @returns Pathname without locale prefix
 *
 * @example
 * ```ts
 * stripLocaleFromPath('/ko/result'); // '/result'
 * stripLocaleFromPath('/en/'); // '/'
 * stripLocaleFromPath('/result'); // '/result'
 * ```
 */
export function stripLocaleFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && isValidLocale(firstSegment)) {
    const remaining = segments.slice(1).join("/");
    return remaining ? `/${remaining}` : "/";
  }

  return pathname || "/";
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { type Locale, locales, defaultLocale } from "./routing";
