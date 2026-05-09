import { getRequestConfig } from "next-intl/server";
import { routing, defaultLocale, type Locale } from "./routing";

/**
 * Server-side request configuration for next-intl
 *
 * This function is called for each request to:
 * 1. Validate the incoming locale from the URL/middleware
 * 2. Load the appropriate translation messages
 * 3. Configure locale-specific settings
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from middleware (already detected via Accept-Language or cookie)
  let locale = await requestLocale;

  // Validate locale - fall back to default if invalid
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  // Dynamically import the translation messages for this locale
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    // Additional locale-specific configuration
    timeZone: locale === "ko" ? "Asia/Seoul" : "UTC",
    now: new Date(),
    // Formats for numbers and dates
    formats: {
      dateTime: {
        short: {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
        long: {
          day: "numeric",
          month: "long",
          year: "numeric",
          weekday: "long",
        },
      },
      number: {
        currency: {
          style: "currency",
          currency: locale === "ko" ? "KRW" : "USD",
          minimumFractionDigits: locale === "ko" ? 0 : 2,
        },
        percent: {
          style: "percent",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      },
    },
  };
});
