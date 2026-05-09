/**
 * Result Page with Dynamic OG Meta Image
 *
 * Server component that generates dynamic Open Graph metadata for sharing.
 * The OG image is served from /api/og endpoint and shows the stock result
 * in a 1200x630 format optimized for link previews.
 */

import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ResultContent } from "./result-client";
import { generateResultMetadata } from "./metadata";

// =============================================================================
// Types
// =============================================================================

interface ResultPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// =============================================================================
// Dynamic Metadata Generation for OG Images
// =============================================================================

/**
 * Generate dynamic metadata including OG image URL based on search params
 *
 * This enables social platforms to show a rich preview when users share
 * their stock regret calculation results.
 */
export async function generateMetadata(
  { params, searchParams }: ResultPageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const resolvedSearchParams = await searchParams;

  // Extract query params
  const ticker = resolvedSearchParams.ticker as string | undefined;
  const date = resolvedSearchParams.date as string | undefined;

  // Get translations for titles
  const t = await getTranslations({ locale, namespace: "result" });
  const commonT = await getTranslations({ locale, namespace: "common" });

  // If we don't have ticker/date, return basic metadata
  if (!ticker || !date) {
    return {
      title: t("title"),
      description: t("description"),
    };
  }

  // Generate dynamic metadata with OG image
  return generateResultMetadata({
    ticker,
    buyDate: date,
    locale,
    appName: commonT("appName"),
  });
}

// =============================================================================
// Page Component (Server Component)
// =============================================================================

export default async function ResultPage({ params }: ResultPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;

  // Enable static rendering for this locale
  setRequestLocale(locale);

  // Get translations
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <Link href="/">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-foreground">{t("appName")}</span>
          </h1>
        </Link>
        <p className="text-sm text-gray-500">
          {t("tagline")}
        </p>
      </div>

      {/* Result Content (Client Component with Suspense) */}
      <ResultContent />
    </main>
  );
}
