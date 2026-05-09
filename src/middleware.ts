import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing, LOCALE_COOKIE_NAME } from "./i18n/routing";

/**
 * next-intl middleware for locale detection and routing
 *
 * This middleware handles:
 * 1. Locale detection from Accept-Language header on first visit
 * 2. Cookie-based persistence of locale preference (NEXT_LOCALE cookie)
 * 3. URL-based locale routing with path rewriting
 * 4. Redirect non-prefixed paths to locale-prefixed paths
 *
 * Detection priority (built into next-intl):
 * 1. NEXT_LOCALE cookie (if set)
 * 2. Accept-Language header
 * 3. Default locale (ko)
 *
 * All configuration is passed through the `routing` object:
 * - localePrefix: 'always' ensures consistent /ko, /en URLs
 * - localeDetection: true enables Accept-Language header detection
 */
const intlMiddleware = createMiddleware(routing);

/**
 * Enhanced middleware wrapper for additional logging/debugging
 * and future extensibility (e.g., analytics, feature flags)
 */
export default function middleware(request: NextRequest) {
  // Get the existing locale cookie for debugging
  const localeCookie = request.cookies.get(LOCALE_COOKIE_NAME);
  const acceptLanguage = request.headers.get("accept-language");

  // Log for debugging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log("[Middleware] Path:", request.nextUrl.pathname);
    console.log("[Middleware] Locale cookie:", localeCookie?.value ?? "not set");
    console.log("[Middleware] Accept-Language:", acceptLanguage?.substring(0, 50) ?? "not set");
  }

  // Delegate to next-intl middleware for locale handling
  return intlMiddleware(request);
}

export const config = {
  /**
   * Matcher configuration for middleware
   *
   * Note: Locale routing requires [locale] folder structure in src/app/
   * to be fully functional. Currently using "as-needed" prefix mode.
   *
   * Matches all pathnames EXCEPT:
   * - /api/* (API routes - should not be locale-prefixed)
   * - /_next/* (Next.js internals)
   * - /og/* (OG image generation routes)
   * - /favicon.ico, /robots.txt, /sitemap.xml (static files)
   * - Files with extensions (images, fonts, etc.)
   */
  matcher: [
    // Match all paths except excluded ones
    "/((?!api|_next|og|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
    // Also match root path
    "/",
  ],
};
