"use client";

/**
 * Date Picker Component
 *
 * A fully accessible date picker for selecting historical stock purchase dates.
 * Features:
 * - Native HTML date input for best mobile/browser support
 * - Validation for past dates only
 * - Weekend detection with hint messaging
 * - Quick date preset buttons for common selections
 * - Market-aware validation
 * - ARIA accessibility support
 * - Dark mode support
 * - i18n support via next-intl
 */

import {
  useState,
  useCallback,
  useEffect,
  useId,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useTranslations, useLocale } from "next-intl";
import type { MarketType } from "@/types/stock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  validateTradingDate,
  getDatePresets,
  getYesterdayString,
  type DateValidation,
} from "@/lib/trading-days";

// =============================================================================
// Types
// =============================================================================

export interface DatePickerProps {
  /** Callback when a valid date is selected */
  onDateChange: (date: string | null) => void;

  /** Currently selected date (YYYY-MM-DD format) */
  value?: string;

  /** Market type for validation context */
  market?: MarketType;

  /** Placeholder text */
  placeholder?: string;

  /** Whether the input is disabled */
  disabled?: boolean;

  /** Custom class name for the container */
  className?: string;

  /** Label for accessibility (visually hidden by default) */
  label?: string;

  /** Whether to show the label visibly */
  showLabel?: boolean;

  /** Whether to show quick date presets */
  showPresets?: boolean;

  /** Locale for labels */
  locale?: "ko" | "en";

  /** Error message from parent (external validation) */
  externalError?: string;
}

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Calendar icon
 */
function CalendarIcon() {
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
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    </svg>
  );
}

/**
 * Warning icon for validation messages
 */
function WarningIcon() {
  return (
    <svg
      className="h-4 w-4"
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
        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
      />
    </svg>
  );
}

/**
 * Error icon for validation errors
 */
function ErrorIcon() {
  return (
    <svg
      className="h-4 w-4"
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
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}

/**
 * Arrow right icon for date correction visualization
 */
function ArrowRightIcon() {
  return (
    <svg
      className="h-4 w-4 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

/**
 * Check icon for corrected date indicator
 */
function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  );
}

/**
 * Date correction feedback component
 */
function DateCorrectionFeedback({
  originalDate,
  correctedDate,
  selectedLabel,
  usingLabel,
  locale,
}: {
  originalDate: string;
  correctedDate: string;
  selectedLabel: string;
  usingLabel: string;
  locale: "ko" | "en";
}) {
  // Format dates for display
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-3 py-2
        animate-in fade-in slide-in-from-top-1 duration-200"
      role="status"
      aria-live="polite"
    >
      {/* Original date (crossed out) */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-amber-700">
          {selectedLabel}:
        </span>
        <span className="text-sm text-amber-600 line-through">
          {formatDisplayDate(originalDate)}
        </span>
      </div>

      {/* Arrow */}
      <ArrowRightIcon />

      {/* Corrected date */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-green-700">
          {usingLabel}:
        </span>
        <span className="text-sm font-medium text-green-600">
          {formatDisplayDate(correctedDate)}
        </span>
        <CheckIcon />
      </div>
    </div>
  );
}


// =============================================================================
// Main Component
// =============================================================================

export function DatePicker({
  onDateChange,
  value = "",
  market,
  placeholder,
  disabled = false,
  className = "",
  label,
  showLabel = false,
  showPresets = true,
  locale: localeProp,
  externalError,
}: DatePickerProps) {
  const t = useTranslations();
  const currentLocale = useLocale() as "ko" | "en";

  // Use prop locale if provided, otherwise use current locale from context
  const locale = localeProp ?? currentLocale;
  const labelText = label ?? t("date.selectPurchaseDate");
  // ==========================================================================
  // State
  // ==========================================================================

  const [internalValue, setInternalValue] = useState(value);
  const [validation, setValidation] = useState<DateValidation>({
    isValid: false,
    isWeekend: false,
    isFuture: false,
    isToday: false,
    wasCorrected: false,
  });
  const [isTouched, setIsTouched] = useState(false);

  // Generate unique IDs for accessibility
  const inputId = useId();
  const errorId = useId();
  const hintId = useId();

  // ==========================================================================
  // Derived State
  // ==========================================================================

  const presets = getDatePresets();
  const maxDate = getYesterdayString();
  const currentValue = value || internalValue;

  // Refs for preset buttons (roving tabindex)
  const presetRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedPresetIndex, setFocusedPresetIndex] = useState(0);

  // Show error only after user interaction
  const showError =
    isTouched && (externalError || (!validation.isValid && validation.message));
  const errorMessage = externalError || validation.message;

  // Show warning for weekend selection (valid but with hint)
  const showWarning = isTouched && validation.isValid && validation.isWeekend;

  // ==========================================================================
  // Handlers
  // ==========================================================================

  /**
   * Handle date input change
   */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      setIsTouched(true);

      // Validate the new value
      const result = validateTradingDate(newValue, market);
      setValidation(result);

      // Notify parent
      if (result.isValid) {
        onDateChange(newValue);
      } else {
        onDateChange(null);
      }
    },
    [market, onDateChange]
  );

  /**
   * Handle preset button click
   */
  const handlePresetClick = useCallback(
    (presetValue: string) => {
      setInternalValue(presetValue);
      setIsTouched(true);

      // Validate and notify
      const result = validateTradingDate(presetValue, market);
      setValidation(result);

      if (result.isValid) {
        onDateChange(presetValue);
      }
    },
    [market, onDateChange]
  );

  /**
   * Handle input blur
   */
  const handleBlur = useCallback(() => {
    setIsTouched(true);
  }, []);

  /**
   * Handle preset keyboard navigation (roving tabindex)
   */
  const handlePresetKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex = index;
      let handled = false;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = (index + 1) % presets.length;
          handled = true;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = (index - 1 + presets.length) % presets.length;
          handled = true;
          break;
        case "Home":
          nextIndex = 0;
          handled = true;
          break;
        case "End":
          nextIndex = presets.length - 1;
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        setFocusedPresetIndex(nextIndex);
        presetRefs.current[nextIndex]?.focus();
      }
    },
    [presets.length]
  );

  /**
   * Handle date input keyboard events
   */
  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // ArrowDown from date input moves focus to first preset
      if (e.key === "ArrowDown" && showPresets && presets.length > 0) {
        e.preventDefault();
        setFocusedPresetIndex(0);
        presetRefs.current[0]?.focus();
      }
    },
    [showPresets, presets.length]
  );

  // ==========================================================================
  // Effects
  // ==========================================================================

  /**
   * Sync with controlled value
   */
  useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      setInternalValue(value);
      if (value) {
        const result = validateTradingDate(value, market);
        setValidation(result);
      }
    }
  }, [value, market, internalValue]);

  // ==========================================================================
  // Render
  // ==========================================================================

  const placeholderText = placeholder ?? t("home.datePlaceholder");

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      <Label
        htmlFor={inputId}
        className={showLabel ? "mb-1.5 block text-sm font-medium" : "sr-only"}
      >
        {labelText}
      </Label>

      {/* Input Container */}
      <div className="relative">
        {/* Calendar icon */}
        <div className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center">
          <CalendarIcon />
        </div>

        {/* Date Input */}
        <Input
          id={inputId}
          type="date"
          value={currentValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          max={maxDate}
          min="1990-01-01"
          placeholder={placeholderText}
          className="h-12 pl-10 text-base"
          aria-invalid={showError ? "true" : undefined}
          aria-describedby={
            showError ? errorId : showWarning ? hintId : undefined
          }
        />
      </div>

      {/* Validation Messages */}
      {showError && errorMessage && (
        <div
          id={errorId}
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-sm text-red-600"
        >
          <ErrorIcon />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Date correction feedback with visual indicator */}
      {showWarning && validation.wasCorrected && validation.correctedDate && (
        <DateCorrectionFeedback
          originalDate={currentValue}
          correctedDate={validation.correctedDate}
          selectedLabel={t("date.selected")}
          usingLabel={t("date.using")}
          locale={locale}
        />
      )}

      {/* Simple weekend hint (fallback if no correction needed) */}
      {showWarning && !validation.wasCorrected && validation.message && (
        <div
          id={hintId}
          className="mt-2 flex items-center gap-1.5 text-sm text-amber-600"
        >
          <WarningIcon />
          <span>{t("date.weekendHint")}</span>
        </div>
      )}

      {/* Quick Date Presets */}
      {showPresets && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-gray-500">
            {t("date.quickSelect")}
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t("accessibility.datePresets")}
          >
            {presets.map((preset, index) => (
              <button
                key={preset.value}
                ref={(el) => {
                  presetRefs.current[index] = el;
                }}
                type="button"
                onClick={() => {
                  handlePresetClick(preset.value);
                  setFocusedPresetIndex(index);
                }}
                onKeyDown={(e) => handlePresetKeyDown(e, index)}
                tabIndex={index === focusedPresetIndex ? 0 : -1}
                className={`
                  rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2
                 :ring-offset-gray-900
                  ${
                    currentValue === preset.value
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200:bg-gray-600"
                  }
                `}
                aria-pressed={currentValue === preset.value}
              >
                {t(`date.preset.${preset.key}` as "date.preset.1week")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {showError
          ? `Error: ${errorMessage}`
          : showWarning && validation.wasCorrected && validation.correctedDate
            ? `Date ${currentValue} selected. Auto-corrected to trading day: ${validation.correctedDate}`
            : showWarning
              ? `Warning: ${validation.message}`
              : currentValue
                ? `Date selected: ${currentValue}`
                : ""}
      </div>
    </div>
  );
}

export default DatePicker;
