"use client";

/**
 * Stock Autocomplete Component
 *
 * A fully accessible autocomplete input for searching and selecting stock tickers.
 * Features:
 * - Debounced search input (300ms default)
 * - Dropdown results with keyboard navigation
 * - Loading and error states
 * - Market type indicators (KR/US)
 * - ARIA accessibility support
 * - i18n support via next-intl
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { useTranslations, useLocale } from "next-intl";
import { useDebounce } from "@/hooks/use-debounce";
import type { StockSearchResult, MarketType, Locale } from "@/types/stock";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

// =============================================================================
// Types
// =============================================================================

export interface StockAutocompleteProps {
  /** Callback when a stock is selected */
  onSelect: (stock: StockSearchResult) => void;

  /** Placeholder text for the input */
  placeholder?: string;

  /** Debounce delay in milliseconds */
  debounceMs?: number;

  /** Minimum characters required before searching */
  minChars?: number;

  /** Whether the input is disabled */
  disabled?: boolean;

  /** Custom class name for the container */
  className?: string;

  /** Auto-focus the input on mount */
  autoFocus?: boolean;

  /** Label for accessibility (visually hidden) */
  label?: string;

  /** Initial value (controlled mode) */
  value?: string;

  /** Callback when input value changes (controlled mode) */
  onChange?: (value: string) => void;
}

interface SearchState {
  results: StockSearchResult[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_MIN_CHARS = 1;

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Loading spinner indicator
 */
function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2">
      <svg
        className="animate-spin h-5 w-5 text-gray-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Market badge (KR/US indicator)
 */
function MarketBadge({ market }: { market: MarketType }) {
  const isKR = market === "KR";
  const bgColor = isKR ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700";
  const darkBgColor = isKR
    ? "dark:bg-red-900/30"
    : "dark:bg-teal-900/30";

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${bgColor} ${darkBgColor}`}
    >
      {market}
    </span>
  );
}

/**
 * Search icon for input
 */
function SearchIcon() {
  return (
    <svg
      className="h-5 w-5 text-gray-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

/**
 * Clear button for input
 */
function ClearButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100:bg-gray-700 transition-colors"
      aria-label={label}
    >
      <svg
        className="h-4 w-4 text-gray-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function StockAutocomplete({
  onSelect,
  placeholder,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  minChars = DEFAULT_MIN_CHARS,
  disabled = false,
  className = "",
  autoFocus = false,
  label,
  value: controlledValue,
  onChange: controlledOnChange,
}: StockAutocompleteProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  // Use provided props or fall back to translations
  const placeholderText = placeholder ?? t("home.searchPlaceholder");
  const labelText = label ?? t("home.searchLabel");
  // ==========================================================================
  // State
  // ==========================================================================

  // Input state (supports both controlled and uncontrolled modes)
  const [internalValue, setInternalValue] = useState("");
  const inputValue = controlledValue ?? internalValue;

  // Search state
  const [searchState, setSearchState] = useState<SearchState>({
    results: [],
    isLoading: false,
    error: null,
    hasSearched: false,
  });

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Debounced search query
  const debouncedQuery = useDebounce(inputValue, debounceMs);

  // ==========================================================================
  // Refs
  // ==========================================================================

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Suppress the next search effect after a programmatic selection,
  // otherwise the debounced query would reopen the dropdown.
  const skipSearchValueRef = useRef<string | null>(null);

  // ==========================================================================
  // Derived State
  // ==========================================================================

  const showDropdown =
    isOpen && (searchState.results.length > 0 || searchState.isLoading || !!searchState.error);
  const hasResults = searchState.results.length > 0;
  const showClearButton = inputValue.length > 0 && !searchState.isLoading;

  // Generate unique IDs for accessibility
  const inputId = useRef(`stock-autocomplete-input-${Math.random().toString(36).slice(2, 9)}`);
  const listboxId = useRef(`stock-autocomplete-listbox-${Math.random().toString(36).slice(2, 9)}`);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  /**
   * Update input value (supports controlled/uncontrolled)
   */
  const updateValue = useCallback(
    (newValue: string) => {
      if (controlledOnChange) {
        controlledOnChange(newValue);
      } else {
        setInternalValue(newValue);
      }
    },
    [controlledOnChange]
  );

  /**
   * Handle input change
   */
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      updateValue(newValue);
      setIsOpen(true);
      setHighlightedIndex(-1);
    },
    [updateValue]
  );

  /**
   * Handle stock selection
   */
  const handleSelect = useCallback(
    (stock: StockSearchResult) => {
      const newValue = stock.displayName ?? stock.name;
      skipSearchValueRef.current = newValue;
      updateValue(newValue);
      setIsOpen(false);
      setHighlightedIndex(-1);
      onSelect(stock);
    },
    [updateValue, onSelect]
  );

  /**
   * Clear input
   */
  const handleClear = useCallback(() => {
    updateValue("");
    setSearchState({
      results: [],
      isLoading: false,
      error: null,
      hasSearched: false,
    });
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [updateValue]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown) {
        // Open dropdown on arrow down when closed
        if (e.key === "ArrowDown" && hasResults) {
          e.preventDefault();
          setIsOpen(true);
          setHighlightedIndex(0);
        }
        return;
      }

      const results = searchState.results;
      const maxIndex = results.length - 1;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
          break;

        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
          break;

        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex <= maxIndex) {
            const selected = results[highlightedIndex];
            if (selected) {
              handleSelect(selected);
            }
          }
          break;

        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;

        case "Tab":
          // Allow normal tab behavior but close dropdown
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [showDropdown, searchState.results, highlightedIndex, handleSelect, hasResults]
  );

  /**
   * Handle input focus
   */
  const handleFocus = useCallback(() => {
    if (searchState.hasSearched && searchState.results.length > 0) {
      setIsOpen(true);
    }
  }, [searchState.hasSearched, searchState.results.length]);

  // ==========================================================================
  // Effects
  // ==========================================================================

  /**
   * Fetch search results when debounced query changes
   */
  useEffect(() => {
    const query = debouncedQuery.trim();

    // After a programmatic selection, the debounced value catches up to the
    // selected text. Skip the search (and the dropdown re-open) once.
    if (skipSearchValueRef.current === debouncedQuery) {
      skipSearchValueRef.current = null;
      return;
    }

    // Skip search if query is too short
    if (query.length < minChars) {
      setSearchState({
        results: [],
        isLoading: false,
        error: null,
        hasSearched: false,
      });
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Start loading
    setSearchState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    // Fetch search results
    fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: abortController.signal,
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Search failed");
        }

        if (data.success) {
          setSearchState({
            results: data.results,
            isLoading: false,
            error: null,
            hasSearched: true,
          });
          setIsOpen(true);
        } else {
          throw new Error(data.error ?? "Search failed");
        }
      })
      .catch((error) => {
        // Ignore abort errors
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setSearchState({
          results: [],
          isLoading: false,
          error: error instanceof Error ? error.message : "Search failed",
          hasSearched: true,
        });
      });

    return () => {
      abortController.abort();
    };
  }, [debouncedQuery, minChars]);

  /**
   * Handle click outside to close dropdown
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Scroll highlighted item into view
   */
  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const highlightedElement = listboxRef.current.children[highlightedIndex] as HTMLElement;
      highlightedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  /**
   * Cleanup abort controller on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Visually hidden label for accessibility */}
      <label htmlFor={inputId.current} className="sr-only">
        {labelText}
      </label>

      {/* Input container */}
      <div className="relative">
        {/* Search icon */}
        <div className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center">
          <SearchIcon />
        </div>

        {/* Input */}
        <Input
          ref={inputRef}
          id={inputId.current}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder={placeholderText}
          className="h-12 pl-10 pr-10 text-base"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls={listboxId.current}
          aria-haspopup="listbox"
          aria-activedescendant={
            highlightedIndex >= 0 ? `stock-option-${highlightedIndex}` : undefined
          }
        />

        {/* Loading spinner or clear button */}
        {searchState.isLoading ? (
          <LoadingSpinner label={t("search.searching")} />
        ) : showClearButton ? (
          <ClearButton onClick={handleClear} label={t("search.clearSearch")} />
        ) : null}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          ref={listboxRef}
          id={listboxId.current}
          role="listbox"
          aria-label="Search results"
          className="stock-autocomplete-dropdown absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
        >
          {/* Loading state */}
          {searchState.isLoading && (
            <li className="flex items-center justify-center py-4 text-gray-500">
              <svg
                className="animate-spin mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t("search.searching")}
            </li>
          )}

          {/* Error state */}
          {searchState.error && (
            <li className="px-4 py-3 text-center">
              <p className="text-red-600">{searchState.error}</p>
              <button
                type="button"
                onClick={() => {
                  // Trigger re-search by updating state
                  setSearchState((prev) => ({ ...prev, error: null, isLoading: true }));
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800:text-blue-300"
              >
                {t("search.tryAgain")}
              </button>
            </li>
          )}

          {/* No results */}
          {!searchState.isLoading && !searchState.error && searchState.results.length === 0 && (
            <li className="px-4 py-3 text-center text-gray-500">
              {t("search.noResults", { query: debouncedQuery })}
            </li>
          )}

          {/* Results */}
          {!searchState.isLoading &&
            !searchState.error &&
            searchState.results.map((stock, index) => (
              <li
                key={`${stock.symbol}-${stock.exchange}`}
                id={`stock-option-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                onClick={() => handleSelect(stock)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  autocomplete-item flex cursor-pointer items-center justify-between px-4 py-2.5
                  transition-colors duration-100
                  ${
                    highlightedIndex === index
                      ? "bg-blue-50"
                      : "hover:bg-gray-50:bg-gray-700/50"
                  }
                `}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {stock.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={stock.logoUrl}
                      alt=""
                      width={32}
                      height={32}
                      loading="lazy"
                      className="h-8 w-8 shrink-0 rounded-md bg-white object-contain p-0.5 ring-1 ring-gray-200"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    {/* Company name (primary) */}
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-gray-900">
                        {stock.displayName ?? stock.name}
                      </span>
                      <MarketBadge market={stock.market} />
                    </div>

                    {/* Ticker (secondary) */}
                    <p className="truncate text-xs text-gray-500">
                      {stock.symbol}
                    </p>
                  </div>

                  {/* Current price */}
                  {typeof stock.currentPrice === "number" && stock.currency && (
                    <div className="ml-2 shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(
                          stock.currentPrice,
                          stock.currency,
                          locale
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Exchange */}
                <span className="ml-3 shrink-0 text-xs text-gray-500">
                  {stock.exchange}
                </span>
              </li>
            ))}
        </ul>
      )}

      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {searchState.isLoading
          ? t("search.searching")
          : searchState.results.length > 0
            ? t("search.resultsFound", { count: searchState.results.length })
            : searchState.hasSearched && inputValue.length >= minChars
              ? t("search.noResultsFound")
              : ""}
      </div>
    </div>
  );
}

export default StockAutocomplete;
