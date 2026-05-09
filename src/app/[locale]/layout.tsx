import { notFound } from "next/navigation";
import { setRequestLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import type { Metadata } from "next";
import { locales, type Locale } from "@/i18n/routing";

// =============================================================================
// Static Params Generation
// =============================================================================

/**
 * Generate static params for all supported locales
 * This enables static generation for each locale
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// =============================================================================
// Metadata Generation
// =============================================================================

/**
 * Generate locale-specific metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;

  const titles: Record<Locale, string> = {
    ko: "껄껄 - 주식 후회 계산기",
    en: "Geol-Geol - Stock Regret Calculator",
  };

  const descriptions: Record<Locale, string> = {
    ko: "그때 샀으면 얼마가 됐을까? 주식 후회를 계산하고 공유하세요!",
    en: "What if I had bought that stock? Calculate your investment regret and share with friends!",
  };

  return {
    title: titles[locale],
    description: descriptions[locale],
    openGraph: {
      title: titles[locale],
      description: descriptions[locale],
      locale: locale === "ko" ? "ko_KR" : "en_US",
    },
  };
}

// =============================================================================
// Locale Layout
// =============================================================================

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  // Validate locale - cast to Locale type after validation
  const locale = localeParam as Locale;
  if (!locales.includes(locale)) {
    notFound();
  }

  // Enable static rendering for this locale
  setRequestLocale(locale);

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
