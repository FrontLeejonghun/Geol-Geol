"use client";

import { useMemo } from "react";
import type { Locale, StockCurrency } from "@/types/stock";
import { buildComparables } from "@/lib/comparables";

interface ComparablesPanelProps {
  absoluteAmount: number | null | undefined;
  currency: StockCurrency;
  locale?: Locale;
  /** Profit (true) → "could buy"; loss → "could've bought instead" */
  isGain: boolean;
}

export function ComparablesPanel({
  absoluteAmount,
  currency,
  locale = "ko",
  isGain,
}: ComparablesPanelProps) {
  const lines = useMemo(() => {
    if (absoluteAmount == null) return [];
    return buildComparables(absoluteAmount, currency, locale);
  }, [absoluteAmount, currency, locale]);

  if (lines.length === 0) return null;

  const heading =
    locale === "ko"
      ? isGain
        ? "이만큼 살 수 있었음"
        : "이만큼 날린 셈"
      : isGain
        ? "That's enough to buy"
        : "You essentially burned";

  return (
    <div className="rounded-lg border bg-muted/40 px-4 py-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {heading}
      </p>
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {lines.map((line) => (
          <li
            key={line.label}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <span aria-hidden className="text-base">
              {line.emoji}
            </span>
            <span className="tabular-nums">{line.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
