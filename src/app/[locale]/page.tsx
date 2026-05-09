"use client";

import { useState, useCallback, useRef, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import type { StockSearchResult } from "@/types/stock";
import { buildResultUrl } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingChips } from "@/components/trending-chips";

// =============================================================================
// Dynamic Imports - Performance Optimization
// =============================================================================

/**
 * StockAutocomplete is critical for initial render, but we can still
 * benefit from code splitting by importing it dynamically with no SSR
 * since it needs client-side APIs for search functionality.
 */
const StockAutocomplete = dynamic(
  () =>
    import("@/components/stock-autocomplete").then(
      (mod) => mod.StockAutocomplete
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
    ),
  }
);

/**
 * DatePicker is loaded after stock selection typically,
 * so dynamic import helps reduce initial bundle.
 */
const DatePicker = dynamic(
  () => import("@/components/date-picker").then((mod) => mod.DatePicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
    ),
  }
);

// =============================================================================
// Types
// =============================================================================

type AmountCurrency = "KRW" | "USD";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  amountCurrency: AmountCurrency;
  onCurrencyChange: (c: AmountCurrency) => void;
  onEnterSubmit?: () => void;
}

// =============================================================================
// Amount Input Component
// =============================================================================

function AmountInput({
  value,
  onChange,
  placeholder,
  label,
  amountCurrency,
  onCurrencyChange,
  onEnterSubmit,
}: AmountInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9]/g, "");
      onChange(rawValue);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onEnterSubmit) {
        e.preventDefault();
        onEnterSubmit();
      }
    },
    [onEnterSubmit]
  );

  return (
    <div className="flex gap-2">
      <Label htmlFor="amount-input" className="sr-only">
        {label}
      </Label>
      <div className="inline-flex h-12 shrink-0 overflow-hidden rounded-lg border">
        {(["KRW", "USD"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onCurrencyChange(c)}
            aria-pressed={amountCurrency === c}
            className={`px-3 text-sm font-medium transition-colors ${
              amountCurrency === c
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {c === "KRW" ? "₩ KRW" : "$ USD"}
          </button>
        ))}
      </div>
      <Input
        id="amount-input"
        type="text"
        inputMode="numeric"
        value={value ? Number(value).toLocaleString() : ""}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-12 flex-1 text-base"
      />
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function Home() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [amountCurrency, setAmountCurrency] = useState<AmountCurrency>(
    locale === "ko" ? "KRW" : "USD"
  );

  // Refs for focus management
  const formRef = useRef<HTMLFormElement>(null);

  const handleStockSelect = useCallback((stock: StockSearchResult) => {
    setSelectedStock(stock);
  }, []);

  const handleDateChange = useCallback((date: string | null) => {
    setSelectedDate(date);
  }, []);

  // Check if we can proceed to calculation
  const canCalculate = selectedStock !== null && selectedDate !== null;

  // Build result URL
  const resultUrl = canCalculate
    ? buildResultUrl({
        ticker: selectedStock.symbol,
        date: selectedDate,
        amount: amount ? Number(amount) : undefined,
        amountCurrency,
      })
    : "";

  // Handle form submission via Enter key or button click
  const handleSubmit = useCallback(() => {
    if (canCalculate && resultUrl) {
      router.push(`/${locale}${resultUrl}`);
    }
  }, [canCalculate, resultUrl, router, locale]);

  // Handle form clear via Escape key
  const handleClear = useCallback(() => {
    setSelectedStock(null);
    setSelectedDate(null);
    setAmount("");
    // Focus will return to the first field via the component
  }, []);

  // Handle form-level keyboard events
  const handleFormKeyDown = useCallback(
    (e: KeyboardEvent<HTMLFormElement>) => {
      // Escape: Clear form and focus first input
      if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
        // Focus the first input after clearing
        const firstInput = formRef.current?.querySelector<HTMLInputElement>(
          "input:not([disabled])"
        );
        firstInput?.focus();
        return;
      }
    },
    [handleClear]
  );

  // Prevent actual form submission (we handle it via JS)
  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (canCalculate) {
        handleSubmit();
      }
    },
    [canCalculate, handleSubmit]
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
            {t("common.appName")}
          </h1>
          <p className="text-muted-foreground">{t("home.subtitle")}</p>
        </div>

        {/* Form with keyboard navigation */}
        <form
          ref={formRef}
          onSubmit={handleFormSubmit}
          onKeyDown={handleFormKeyDown}
          role="form"
          aria-label={t("accessibility.stockSearchForm")}
        >
          {/* Stock Search */}
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-medium text-foreground">
              {t("home.step1")}
            </h2>
            <StockAutocomplete
              onSelect={handleStockSelect}
              placeholder={t("home.searchPlaceholder")}
              label={t("home.searchLabel")}
              autoFocus
            />
            <TrendingChips locale={locale} onSelect={handleStockSelect} />
          </div>

        {/* Selected Stock Display */}
        {selectedStock && (
          <Card className="mb-6">
            <CardContent>
              <div className="flex items-center gap-3">
                {selectedStock.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedStock.logoUrl}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-md bg-white object-contain p-0.5 ring-1 ring-border"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {selectedStock.displayName ?? selectedStock.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedStock.symbol} · {selectedStock.market}
                  </p>
                </div>
                {typeof selectedStock.currentPrice === "number" &&
                  selectedStock.currency && (
                    <p className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                      {new Intl.NumberFormat(
                        locale === "ko" ? "ko-KR" : "en-US",
                        {
                          style: "currency",
                          currency: selectedStock.currency,
                          maximumFractionDigits: 0,
                        }
                      ).format(selectedStock.currentPrice)}
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Date Picker */}
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-foreground">
            {t("home.step2")}
          </h2>
          <DatePicker
            onDateChange={handleDateChange}
            value={selectedDate ?? undefined}
            market={selectedStock?.market}
            showPresets={true}
            locale={locale}
            placeholder={t("home.datePlaceholder")}
            label={t("home.dateLabel")}
          />
        </div>

        {/* Amount Input (Optional) */}
        {selectedStock && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-medium text-foreground">
              {t("home.step3")}
            </h2>
            <AmountInput
              value={amount}
              onChange={setAmount}
              placeholder={t("home.amountPlaceholder")}
              label={t("home.amountLabel")}
              amountCurrency={amountCurrency}
              onCurrencyChange={setAmountCurrency}
              onEnterSubmit={canCalculate ? handleSubmit : undefined}
            />
          </div>
        )}

        {/* Calculate Button */}
          {canCalculate && (
            <div className="mb-6">
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-base"
              >
                {t("home.calculateRegret")}
              </Button>
            </div>
          )}

          {/* Summary */}
          {canCalculate && (
            <Card className="bg-muted/40">
              <CardContent>
                <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                  {t("home.summary")}
                </h2>
                <p className="text-sm text-foreground">
                  {t("home.summaryText", {
                    symbol:
                      selectedStock.displayName ??
                      selectedStock.name ??
                      selectedStock.symbol,
                    date: selectedDate,
                  })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {!canCalculate && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>{t("home.instructions")}</p>
            </div>
          )}

          {/* Keyboard hints */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t("accessibility.keyboardHint")}
          </p>
        </form>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            {t("footer.disclaimer")}
          </p>
        </footer>
      </div>
    </main>
  );
}
