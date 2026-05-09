"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CalculationResult, Theme } from "@/types/stock";
import dynamic from "next/dynamic";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ErrorDisplay as ReusableErrorDisplay,
  getErrorTypeFromCode,
} from "@/components/error-display";

// =============================================================================
// Dynamic Imports
// =============================================================================

/**
 * Dynamically import heavy components for better initial load performance
 */
const ResultVisualizationContainer = dynamic(
  () =>
    import("@/components/result-visualization-container").then(
      (mod) => mod.ResultVisualizationContainer
    ),
  {
    loading: () => <ResultSkeleton />,
    ssr: false,
  }
);

const ResultActions = dynamic(
  () =>
    import("@/components/result-actions").then((mod) => mod.ResultActions),
  {
    ssr: false,
    // Reserve same dimensions as final 3 buttons to avoid CLS.
    loading: () => (
      <div className="flex h-9 items-center justify-center gap-2">
        <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
      </div>
    ),
  }
);

// =============================================================================
// Loading Skeleton
// =============================================================================

export function ResultSkeleton() {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
        {/* Header: logo + name+industry on left, price+date on right */}
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="flex flex-col gap-1.5 min-w-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        {/* Meme copy */}
        <div className="flex flex-col items-center gap-2 px-4 py-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-36" />
        </div>
        {/* Big % badge */}
        <div className="flex flex-col items-center gap-3 px-4 py-4">
          <Skeleton className="h-12 w-44 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        {/* Chart — match real chartHeight (240) */}
        <div className="px-4 pb-3" style={{ minHeight: 248 }}>
          <Skeleton className="h-60 w-full rounded-lg" />
        </div>
        {/* PnL summary */}
        <div className="px-4 pb-4">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        {/* Comparables */}
        <div className="px-4 pb-4">
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        {/* Branding footer */}
        <div className="border-t px-4 py-3 flex justify-center">
          <Skeleton className="h-4 w-24" />
        </div>
        {/* Action buttons */}
        <div className="border-t px-4 py-3 flex items-center justify-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Error Component
// =============================================================================

interface ResultErrorDisplayProps {
  errorKey: string;
  onRetry: () => void;
  theme?: Theme;
  locale?: Locale;
}

function ResultErrorDisplay({ errorKey, onRetry, theme = "light", locale = "ko" }: ResultErrorDisplayProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <ReusableErrorDisplay
        type={getErrorTypeFromCode(errorKey)}
        errorKey={errorKey}
        onRetry={onRetry}
        theme={theme}
        locale={locale}
        showRetryLoading
      />
    </div>
  );
}

// =============================================================================
// Missing Parameters Component
// =============================================================================

function MissingParams() {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  return (
    <div className="w-full max-w-lg mx-auto">
      <Alert variant="default">
        <AlertTitle>{t("error.invalidTicker")}</AlertTitle>
        <AlertDescription>{t("home.instructions")}</AlertDescription>
        <Link
          href={`/${locale}`}
          className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          {t("home.title")}
        </Link>
      </Alert>
    </div>
  );
}

// =============================================================================
// Result Content Inner Component
// =============================================================================

function ResultContentInner() {
  const searchParams = useSearchParams();
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme: Theme = "light";

  // Handle global keyboard events (Escape to go back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Don't interfere if user is typing in an input
        const activeElement = document.activeElement;
        if (
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA")
        ) {
          return;
        }
        router.push(`/${locale}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, locale]);

  // Parse URL parameters
  const ticker = searchParams.get("ticker");
  const date = searchParams.get("date");
  const amountParam = searchParams.get("amount");
  const amount = amountParam ? Number(amountParam) : undefined;
  const amountCurrencyParam = searchParams.get("amountCurrency");
  const amountCurrency: "KRW" | "USD" | null =
    amountCurrencyParam === "KRW" || amountCurrencyParam === "USD"
      ? amountCurrencyParam
      : null;

  // Fetch calculation result
  const fetchResult = useCallback(async () => {
    if (!ticker || !date) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        ticker,
        buyDate: date,
        locale,
      });
      if (amount !== undefined) {
        params.set("virtualAmount", amount.toString());
      }
      if (amountCurrency) {
        params.set("amountCurrency", amountCurrency);
      }

      const response = await fetch(`/api/quote?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.code || "unknownError");
      }

      setResult(data.data);
    } catch (err) {
      const errorCode =
        err instanceof Error ? err.message : "unknownError";
      setError(errorCode);
    } finally {
      setLoading(false);
    }
  }, [ticker, date, amount, amountCurrency, locale]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  // Handle retry - returns promise for ErrorDisplay loading state tracking
  const handleRetry = useCallback(async () => {
    await fetchResult();
  }, [fetchResult]);

  // Missing required params
  if (!ticker || !date) {
    return <MissingParams />;
  }

  // Loading state
  if (loading) {
    return <ResultSkeleton />;
  }

  // Error state
  if (error) {
    return <ResultErrorDisplay errorKey={error} onRetry={handleRetry} theme={theme} locale={locale} />;
  }

  // No result
  if (!result) {
    return <ResultErrorDisplay errorKey="noData" onRetry={handleRetry} theme={theme} locale={locale} />;
  }

  // Detect that the requested date was auto-corrected by more than a
  // typical weekend/holiday gap — likely the ticker was pre-IPO.
  const rawDate = new Date(result.rawBuyDate);
  const resolvedDate = new Date(result.resolvedBuyDate);
  const gapDays =
    Math.abs(resolvedDate.getTime() - rawDate.getTime()) /
    (1000 * 60 * 60 * 24);
  const showIpoBanner = gapDays > 14;

  // Render result
  return (
    <div className="w-full max-w-lg mx-auto">
      {showIpoBanner && (
        <Alert variant="default" className="mb-4">
          <AlertTitle>
            {locale === "ko"
              ? "상장 전 날짜를 선택하셨어요"
              : "You picked a pre-IPO date"}
          </AlertTitle>
          <AlertDescription>
            {locale === "ko"
              ? `${result.rawBuyDate} 시점엔 거래되기 전이라 상장 첫 거래일인 ${result.resolvedBuyDate}로 보정했습니다.`
              : `${result.rawBuyDate} predates this stock's IPO, so we used the first trading day (${result.resolvedBuyDate}) instead.`}
          </AlertDescription>
        </Alert>
      )}
      {/* Result Card */}
      <ResultVisualizationContainer
        stock={result.stock}
        buyDate={result.resolvedBuyDate}
        pastPrice={result.pastPrice}
        currentPrice={result.currentPrice}
        pnl={result.pnl}
        memeCopy={result.memeCopy}
        priceHistory={result.priceHistory}
        locale={locale}
        theme={theme}
        variant="card"
        showBranding={true}
        actions={<ResultActions result={result} locale={locale} theme={theme} />}
      />

      {/* Back to Home */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-700 hover:text-foreground:text-foreground transition-colors rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2:ring-offset-gray-900"
          aria-label={t("accessibility.backToHome")}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {t("home.title")}
        </Link>
      </div>

      {/* Footer Disclaimer */}
      <footer className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          {t("footer.disclaimer")}
        </p>
      </footer>
    </div>
  );
}

// =============================================================================
// Exported Result Content with Suspense
// =============================================================================

export function ResultContent() {
  return (
    <Suspense fallback={<ResultSkeleton />}>
      <ResultContentInner />
    </Suspense>
  );
}
