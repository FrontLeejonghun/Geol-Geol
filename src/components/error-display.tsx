"use client";

/**
 * ErrorDisplay Component
 *
 * A reusable error display component with friendly error messaging and retry functionality.
 * Features:
 * - Multiple error type support with appropriate icons and colors
 * - Retry button with loading state
 * - Full i18n support (ko/en)
 * - Theme-aware styling (light/dark)
 * - Accessible design with ARIA attributes
 * - Customizable title, description, and actions
 */

import {
  useState,
  useCallback,
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import type { Locale, Theme } from "@/types/stock";

// =============================================================================
// Types
// =============================================================================

/**
 * Predefined error types with associated styling
 */
export type ErrorType =
  | "network"      // Network/connectivity issues
  | "server"       // Server-side errors (5xx)
  | "notFound"     // Resource not found (404)
  | "invalidInput" // Invalid user input
  | "noData"       // No data available
  | "timeout"      // Request timeout
  | "unknown";     // Unknown/generic error

export interface ErrorDisplayProps {
  /** Error type for appropriate styling and icon */
  type?: ErrorType;
  /** Custom title (overrides i18n) */
  title?: string;
  /** Custom description (overrides i18n) */
  description?: string;
  /** Error message key for i18n lookup */
  errorKey?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void | Promise<void>;
  /** Show loading spinner on retry button while retrying */
  showRetryLoading?: boolean;
  /** Custom retry button text */
  retryText?: string;
  /** Custom action button(s) to show below description */
  actions?: ReactNode;
  /** Show retry button (default: true if onRetry provided) */
  showRetryButton?: boolean;
  /** Custom icon element (overrides default) */
  icon?: ReactNode;
  /** Theme for styling */
  theme?: Theme;
  /** Locale for i18n */
  locale?: Locale;
  /** Additional CSS classes for container */
  className?: string;
  /** Compact mode with smaller padding */
  compact?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Aria-live setting for screen readers */
  "aria-live"?: "polite" | "assertive" | "off";
}

// =============================================================================
// Labels & i18n
// =============================================================================

interface Labels {
  titles: Record<ErrorType, string>;
  descriptions: Record<ErrorType, string>;
  retry: string;
  retrying: string;
}

const LABELS: Record<Locale, Labels> = {
  ko: {
    titles: {
      network: "네트워크 오류",
      server: "서버 오류",
      notFound: "찾을 수 없음",
      invalidInput: "잘못된 입력",
      noData: "데이터 없음",
      timeout: "요청 시간 초과",
      unknown: "오류 발생",
    },
    descriptions: {
      network: "인터넷 연결을 확인하고 다시 시도해주세요.",
      server: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      notFound: "요청하신 정보를 찾을 수 없습니다.",
      invalidInput: "입력하신 정보가 올바르지 않습니다.",
      noData: "해당 날짜의 데이터가 없습니다.",
      timeout: "요청 시간이 초과되었습니다. 다시 시도해주세요.",
      unknown: "알 수 없는 오류가 발생했습니다.",
    },
    retry: "다시 시도",
    retrying: "시도 중...",
  },
  en: {
    titles: {
      network: "Network Error",
      server: "Server Error",
      notFound: "Not Found",
      invalidInput: "Invalid Input",
      noData: "No Data",
      timeout: "Request Timeout",
      unknown: "Error Occurred",
    },
    descriptions: {
      network: "Please check your internet connection and try again.",
      server: "Something went wrong on our end. Please try again later.",
      notFound: "The requested information could not be found.",
      invalidInput: "The provided information is not valid.",
      noData: "No data available for this date.",
      timeout: "The request took too long. Please try again.",
      unknown: "An unknown error occurred.",
    },
    retry: "Retry",
    retrying: "Retrying...",
  },
};

// =============================================================================
// Error Type Styling
// =============================================================================

interface ErrorTypeStyle {
  emoji: string;
  borderColor: {
    light: string;
    dark: string;
  };
  bgColor: {
    light: string;
    dark: string;
  };
  titleColor: {
    light: string;
    dark: string;
  };
  descColor: {
    light: string;
    dark: string;
  };
  buttonColor: {
    light: string;
    dark: string;
  };
  buttonHover: {
    light: string;
    dark: string;
  };
  focusRing: string;
}

const ERROR_STYLES: Record<ErrorType, ErrorTypeStyle> = {
  network: {
    emoji: "📡",
    borderColor: { light: "border-orange-200", dark: "border-orange-800" },
    bgColor: { light: "bg-orange-50", dark: "bg-orange-900/20" },
    titleColor: { light: "text-orange-700", dark: "text-orange-400" },
    descColor: { light: "text-orange-700", dark: "text-orange-300" },
    buttonColor: { light: "bg-orange-600", dark: "bg-orange-600" },
    buttonHover: { light: "hover:bg-orange-700", dark: "hover:bg-orange-500" },
    focusRing: "focus:ring-orange-500",
  },
  server: {
    emoji: "🔧",
    borderColor: { light: "border-red-200", dark: "border-red-800" },
    bgColor: { light: "bg-red-50", dark: "bg-red-900/20" },
    titleColor: { light: "text-red-700", dark: "text-red-400" },
    descColor: { light: "text-red-700", dark: "text-red-300" },
    buttonColor: { light: "bg-red-600", dark: "bg-red-600" },
    buttonHover: { light: "hover:bg-red-700", dark: "hover:bg-red-500" },
    focusRing: "focus:ring-red-500",
  },
  notFound: {
    emoji: "🔍",
    borderColor: { light: "border-amber-200", dark: "border-amber-800" },
    bgColor: { light: "bg-amber-50", dark: "bg-amber-900/20" },
    titleColor: { light: "text-amber-700", dark: "text-amber-400" },
    descColor: { light: "text-amber-700", dark: "text-amber-300" },
    buttonColor: { light: "bg-amber-600", dark: "bg-amber-600" },
    buttonHover: { light: "hover:bg-amber-700", dark: "hover:bg-amber-500" },
    focusRing: "focus:ring-amber-500",
  },
  invalidInput: {
    emoji: "⚠️",
    borderColor: { light: "border-yellow-200", dark: "border-yellow-800" },
    bgColor: { light: "bg-yellow-50", dark: "bg-yellow-900/20" },
    titleColor: { light: "text-yellow-700", dark: "text-yellow-400" },
    descColor: { light: "text-yellow-700", dark: "text-yellow-300" },
    buttonColor: { light: "bg-yellow-600", dark: "bg-yellow-600" },
    buttonHover: { light: "hover:bg-yellow-700", dark: "hover:bg-yellow-500" },
    focusRing: "focus:ring-yellow-500",
  },
  noData: {
    emoji: "📭",
    borderColor: { light: "border-slate-200", dark: "border-slate-700" },
    bgColor: { light: "bg-slate-50", dark: "bg-slate-800/50" },
    titleColor: { light: "text-slate-700", dark: "text-slate-300" },
    descColor: { light: "text-slate-600", dark: "text-slate-400" },
    buttonColor: { light: "bg-slate-600", dark: "bg-slate-600" },
    buttonHover: { light: "hover:bg-slate-700", dark: "hover:bg-slate-500" },
    focusRing: "focus:ring-slate-500",
  },
  timeout: {
    emoji: "⏱️",
    borderColor: { light: "border-purple-200", dark: "border-purple-800" },
    bgColor: { light: "bg-purple-50", dark: "bg-purple-900/20" },
    titleColor: { light: "text-purple-700", dark: "text-purple-400" },
    descColor: { light: "text-purple-600", dark: "text-purple-300" },
    buttonColor: { light: "bg-purple-600", dark: "bg-purple-600" },
    buttonHover: { light: "hover:bg-purple-700", dark: "hover:bg-purple-500" },
    focusRing: "focus:ring-purple-500",
  },
  unknown: {
    emoji: "😢",
    borderColor: { light: "border-red-200", dark: "border-red-800" },
    bgColor: { light: "bg-red-50", dark: "bg-red-900/20" },
    titleColor: { light: "text-red-700", dark: "text-red-400" },
    descColor: { light: "text-red-700", dark: "text-red-300" },
    buttonColor: { light: "bg-red-600", dark: "bg-red-600" },
    buttonHover: { light: "hover:bg-red-700", dark: "hover:bg-red-500" },
    focusRing: "focus:ring-red-500",
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Map API error codes to error types
 */
export function getErrorTypeFromCode(code: string): ErrorType {
  const codeMap: Record<string, ErrorType> = {
    TICKER_NOT_FOUND: "notFound",
    INVALID_DATE: "invalidInput",
    FUTURE_DATE: "invalidInput",
    NO_PRICE_DATA: "noData",
    EXTERNAL_API_ERROR: "server",
    RATE_LIMITED: "timeout",
    INVALID_REQUEST: "invalidInput",
    INTERNAL_ERROR: "server",
    networkError: "network",
    serverError: "server",
    unknownError: "unknown",
    noData: "noData",
    invalidTicker: "invalidInput",
    fetchFailed: "network",
  };
  return codeMap[code] ?? "unknown";
}

// =============================================================================
// Icons
// =============================================================================

function SpinnerIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 animate-spin ${className}`}
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
  );
}

function RetryIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * ErrorDisplay - A reusable error UI component
 *
 * Displays user-friendly error messages with appropriate styling based on error type.
 * Includes optional retry functionality with loading state.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ErrorDisplay
 *   type="network"
 *   onRetry={() => refetch()}
 *   locale="ko"
 * />
 *
 * // With custom content
 * <ErrorDisplay
 *   type="notFound"
 *   title="Stock not found"
 *   description="We couldn't find a stock with that ticker."
 *   onRetry={handleRetry}
 *   theme="dark"
 * />
 *
 * // Compact mode
 * <ErrorDisplay
 *   type="server"
 *   compact
 *   onRetry={handleRetry}
 * />
 * ```
 */
export function ErrorDisplay({
  type = "unknown",
  title,
  description,
  errorKey,
  onRetry,
  showRetryLoading = true,
  retryText,
  actions,
  showRetryButton,
  icon,
  theme = "light",
  locale = "ko",
  className = "",
  compact = false,
  size = "md",
  "aria-live": ariaLive = "polite",
}: ErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const labels = LABELS[locale];
  const themeKey = theme;

  // Determine effective error type from errorKey if provided
  const effectiveType = errorKey ? getErrorTypeFromCode(errorKey) : type;
  const effectiveStyle = ERROR_STYLES[effectiveType];

  // Resolve title and description
  const resolvedTitle = title ?? labels.titles[effectiveType];
  const resolvedDescription = description ?? labels.descriptions[effectiveType];
  const resolvedRetryText = retryText ?? (isRetrying ? labels.retrying : labels.retry);

  // Determine if retry button should be shown
  const shouldShowRetry = showRetryButton ?? !!onRetry;

  // Handle retry click
  const handleRetry = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (isRetrying || !onRetry) return;

      setIsRetrying(true);
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    },
    [isRetrying, onRetry]
  );

  // Handle keyboard interaction
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === "Enter" || e.key === " ") && onRetry && !isRetrying) {
        e.preventDefault();
        setIsRetrying(true);
        try {
          await onRetry();
        } finally {
          setIsRetrying(false);
        }
      }
    },
    [isRetrying, onRetry]
  );

  // Size-based styles
  const sizeStyles = {
    sm: {
      container: compact ? "p-3" : "p-4",
      icon: "text-2xl",
      title: "text-base",
      description: "text-sm",
      button: "px-4 py-1.5 text-sm",
      gap: "gap-1",
    },
    md: {
      container: compact ? "p-4" : "p-6",
      icon: "text-4xl",
      title: "text-xl",
      description: "text-base",
      button: "px-6 py-2",
      gap: "gap-2",
    },
    lg: {
      container: compact ? "p-5" : "p-8",
      icon: "text-5xl",
      title: "text-2xl",
      description: "text-lg",
      button: "px-8 py-3 text-lg",
      gap: "gap-3",
    },
  };

  const s = sizeStyles[size];

  return (
    <div
      role="alert"
      aria-live={ariaLive}
      className={`
        w-full rounded-2xl border
        ${effectiveStyle.borderColor[themeKey]}
        ${effectiveStyle.bgColor[themeKey]}
        ${s.container}
        text-center
        ${className}
      `}
    >
      {/* Icon */}
      <div className={`${s.icon} mb-3`} aria-hidden="true">
        {icon ?? effectiveStyle.emoji}
      </div>

      {/* Title */}
      <h2
        className={`
          ${s.title} font-bold mb-2
          ${effectiveStyle.titleColor[themeKey]}
        `}
      >
        {resolvedTitle}
      </h2>

      {/* Description */}
      <p
        className={`
          ${s.description} mb-4
          ${effectiveStyle.descColor[themeKey]}
        `}
      >
        {resolvedDescription}
      </p>

      {/* Actions */}
      {(shouldShowRetry || actions) && (
        <div className={`flex flex-col items-center ${s.gap}`}>
          {/* Retry Button */}
          {shouldShowRetry && onRetry && (
            <button
              type="button"
              onClick={handleRetry}
              onKeyDown={handleKeyDown}
              disabled={isRetrying}
              className={`
                inline-flex items-center justify-center gap-2
                ${s.button}
                rounded-lg font-medium text-white
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${theme === "dark" ? "focus:ring-offset-gray-900" : "focus:ring-offset-white"}
                ${effectiveStyle.buttonColor[themeKey]}
                ${isRetrying ? "opacity-75 cursor-wait" : effectiveStyle.buttonHover[themeKey]}
                ${effectiveStyle.focusRing}
              `}
              aria-busy={isRetrying}
              aria-label={resolvedRetryText}
            >
              {showRetryLoading && isRetrying ? (
                <SpinnerIcon />
              ) : (
                <RetryIcon />
              )}
              <span>{resolvedRetryText}</span>
            </button>
          )}

          {/* Custom Actions */}
          {actions}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Compound Components
// =============================================================================

/**
 * Network error display variant
 */
export function NetworkErrorDisplay(
  props: Omit<ErrorDisplayProps, "type">
) {
  return <ErrorDisplay {...props} type="network" />;
}

/**
 * Server error display variant
 */
export function ServerErrorDisplay(
  props: Omit<ErrorDisplayProps, "type">
) {
  return <ErrorDisplay {...props} type="server" />;
}

/**
 * Not found error display variant
 */
export function NotFoundErrorDisplay(
  props: Omit<ErrorDisplayProps, "type">
) {
  return <ErrorDisplay {...props} type="notFound" />;
}

/**
 * No data error display variant
 */
export function NoDataErrorDisplay(
  props: Omit<ErrorDisplayProps, "type">
) {
  return <ErrorDisplay {...props} type="noData" />;
}

/**
 * Compact inline error display
 */
export function InlineErrorDisplay(
  props: Omit<ErrorDisplayProps, "compact" | "size">
) {
  return <ErrorDisplay {...props} compact size="sm" />;
}

// =============================================================================
// Export
// =============================================================================

export default ErrorDisplay;
