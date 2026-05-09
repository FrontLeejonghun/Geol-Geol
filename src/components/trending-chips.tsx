"use client";

import { useEffect, useState } from "react";
import type { Locale, StockSearchResult } from "@/types/stock";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingChipsProps {
  locale: Locale;
  onSelect: (stock: StockSearchResult) => void;
}

export function TrendingChips({ locale, onSelect }: TrendingChipsProps) {
  const [results, setResults] = useState<StockSearchResult[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const region = locale === "ko" ? "KR" : "US";
    const ac = new AbortController();
    fetch(`/api/trending?region=${region}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.results)) setResults(d.results);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [locale]);

  const heading = locale === "ko" ? "지금 핫한 종목" : "Trending now";

  if (!loading && (!results || results.length === 0)) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {heading}
      </p>
      <div className="flex flex-wrap gap-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-full" />
            ))
          : results!.map((s) => (
              <button
                key={s.symbol}
                type="button"
                onClick={() => onSelect(s)}
                className="inline-flex h-9 items-center gap-2 rounded-full border bg-card pl-1.5 pr-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.logoUrl}
                    alt=""
                    width={24}
                    height={24}
                    loading="lazy"
                    className="h-6 w-6 rounded-md bg-white object-contain p-0.5 ring-1 ring-border"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="h-6 w-6 rounded-md bg-muted" aria-hidden />
                )}
                <span className="max-w-[8rem] truncate">
                  {s.displayName ?? s.name}
                </span>
              </button>
            ))}
      </div>
    </div>
  );
}
