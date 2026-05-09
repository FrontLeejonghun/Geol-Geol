"use client";

/**
 * Download Button Component
 *
 * A specialized button for downloading share images with:
 * - Size selection dropdown (portrait/landscape)
 * - Progress states and visual feedback
 * - Filename customization
 * - Error handling with retry
 */

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type MouseEvent,
} from "react";
import type {
  CalculationResult,
  Theme,
  Locale,
  ShareImageSize,
} from "@/types/stock";
import { useShareImage } from "@/hooks/use-share-image";

// =============================================================================
// Types
// =============================================================================

export interface DownloadButtonProps {
  /** Calculation result to generate share image from */
  result: CalculationResult;
  /** Theme for share image styling */
  theme?: Theme;
  /** Locale for formatting and labels */
  locale?: Locale;
  /** Default image size */
  defaultSize?: ShareImageSize;
  /** Custom filename prefix (without extension) */
  filenamePrefix?: string;
  /** Show size selector dropdown */
  showSizeSelector?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when download completes */
  onComplete?: (size: ShareImageSize) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

export interface DownloadButtonSimpleProps {
  /** Calculation result to generate share image from */
  result: CalculationResult;
  /** Theme for share image styling */
  theme?: Theme;
  /** Locale for formatting and labels */
  locale?: Locale;
  /** Image size preset */
  size?: ShareImageSize;
  /** Additional CSS classes */
  className?: string;
  /** Callback when download completes */
  onComplete?: () => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

// =============================================================================
// Size Configuration
// =============================================================================

interface SizeOption {
  value: ShareImageSize;
  labelKo: string;
  labelEn: string;
  descriptionKo: string;
  descriptionEn: string;
  icon: string;
}

const SIZE_OPTIONS: SizeOption[] = [
  {
    value: "1080x1350",
    labelKo: "인스타그램",
    labelEn: "Instagram",
    descriptionKo: "1080×1350 (세로)",
    descriptionEn: "1080×1350 (Portrait)",
    icon: "📱",
  },
  {
    value: "1200x630",
    labelKo: "트위터/OG",
    labelEn: "Twitter/OG",
    descriptionKo: "1200×630 (가로)",
    descriptionEn: "1200×630 (Landscape)",
    icon: "🖥️",
  },
];

// =============================================================================
// Icons
// =============================================================================

function DownloadIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

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

function ChevronDownIcon({ className = "" }: { className?: string }) {
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
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function AlertIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

// =============================================================================
// Simple Download Button (Single Size)
// =============================================================================

/**
 * Simple download button for a single size
 *
 * @example
 * ```tsx
 * <DownloadButtonSimple
 *   result={calculationResult}
 *   size="1080x1350"
 *   theme="dark"
 *   locale="ko"
 * />
 * ```
 */
export function DownloadButtonSimple({
  result,
  theme = "light",
  locale = "ko",
  size = "1080x1350",
  className = "",
  onComplete,
  onError,
}: DownloadButtonSimpleProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    isGenerating,
    isDownloading,
    error,
    generateFromResult,
    download,
    reset,
  } = useShareImage({ theme, locale, defaultSize: size });

  const handleClick = useCallback(async () => {
    try {
      reset();
      const image = await generateFromResult(result, size);
      if (!image) return;

      await download(undefined, image);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onComplete?.();
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      onError?.(e);
    }
  }, [generateFromResult, result, size, download, reset, onComplete, onError]);

  const isLoading = isGenerating || isDownloading;

  // Get localized labels
  const labels = {
    download: locale === "ko" ? "이미지 저장" : "Download Image",
    downloading: locale === "ko" ? "생성 중..." : "Generating...",
    success: locale === "ko" ? "저장 완료!" : "Downloaded!",
    retry: locale === "ko" ? "다시 시도" : "Retry",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center gap-2
        px-5 py-2.5 rounded-xl font-medium
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${
          showSuccess
            ? "bg-green-500 text-white focus:ring-green-500"
            : error
              ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus:ring-red-500 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
              : theme === "dark"
                ? "bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-slate-500 focus:ring-offset-slate-900"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500"
        }
        ${isLoading ? "cursor-wait opacity-75" : "cursor-pointer"}
        ${className}
      `}
      aria-label={
        error
          ? labels.retry
          : showSuccess
            ? labels.success
            : isLoading
              ? labels.downloading
              : labels.download
      }
    >
      {isLoading ? (
        <SpinnerIcon />
      ) : showSuccess ? (
        <CheckIcon />
      ) : error ? (
        <AlertIcon className="text-red-500" />
      ) : (
        <DownloadIcon />
      )}
      <span>
        {error
          ? labels.retry
          : showSuccess
            ? labels.success
            : isLoading
              ? labels.downloading
              : labels.download}
      </span>
    </button>
  );
}

// =============================================================================
// Download Button with Size Selector
// =============================================================================

/**
 * Download button with dropdown size selector
 *
 * @example
 * ```tsx
 * <DownloadButton
 *   result={calculationResult}
 *   showSizeSelector
 *   theme="dark"
 *   locale="ko"
 * />
 * ```
 */
export function DownloadButton({
  result,
  theme = "light",
  locale = "ko",
  defaultSize = "1080x1350",
  filenamePrefix,
  showSizeSelector = true,
  className = "",
  onComplete,
  onError,
}: DownloadButtonProps) {
  const [selectedSize, setSelectedSize] = useState<ShareImageSize>(defaultSize);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isGenerating,
    isDownloading,
    error,
    generateFromResult,
    download,
    reset,
  } = useShareImage({ theme, locale, defaultSize: selectedSize });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowDropdown(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleDownload = useCallback(
    async (size: ShareImageSize) => {
      try {
        reset();
        setShowDropdown(false);

        const image = await generateFromResult(result, size);
        if (!image) return;

        // Generate filename
        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, "-")
          .slice(0, 19);
        const sizeLabel = size === "1080x1350" ? "portrait" : "og";
        const prefix = filenamePrefix ?? "geolgeol";
        const filename = `${prefix}-${sizeLabel}-${timestamp}`;

        await download({ filename }, image);

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        onComplete?.(size);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        onError?.(e);
      }
    },
    [
      generateFromResult,
      result,
      download,
      reset,
      filenamePrefix,
      onComplete,
      onError,
    ]
  );

  const handleButtonClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      if (showSizeSelector) {
        setShowDropdown(!showDropdown);
      } else {
        handleDownload(selectedSize);
      }
    },
    [showSizeSelector, showDropdown, handleDownload, selectedSize]
  );

  const handleSizeSelect = useCallback(
    (size: ShareImageSize) => {
      setSelectedSize(size);
      handleDownload(size);
    },
    [handleDownload]
  );

  const isLoading = isGenerating || isDownloading;

  // Get localized labels
  const labels = {
    download: locale === "ko" ? "이미지 저장" : "Download",
    downloading: locale === "ko" ? "생성 중..." : "Generating...",
    success: locale === "ko" ? "저장 완료!" : "Downloaded!",
    selectSize: locale === "ko" ? "사이즈 선택" : "Select Size",
  };

  // Don't show dropdown if not using size selector
  if (!showSizeSelector) {
    return (
      <DownloadButtonSimple
        result={result}
        theme={theme}
        locale={locale}
        size={selectedSize}
        className={className}
        onComplete={() => onComplete?.(selectedSize)}
        onError={onError}
      />
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Main Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isLoading}
        className={`
          inline-flex items-center justify-center gap-2
          px-5 py-2.5 rounded-xl font-medium
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${
            showSuccess
              ? "bg-green-500 text-white focus:ring-green-500"
              : error
                ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus:ring-red-500 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                : theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-slate-500 focus:ring-offset-slate-900"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500"
          }
          ${isLoading ? "cursor-wait opacity-75" : "cursor-pointer"}
        `}
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-label={labels.download}
      >
        {isLoading ? (
          <SpinnerIcon />
        ) : showSuccess ? (
          <CheckIcon />
        ) : (
          <DownloadIcon />
        )}
        <span>
          {showSuccess
            ? labels.success
            : isLoading
              ? labels.downloading
              : labels.download}
        </span>
        {!isLoading && !showSuccess && (
          <ChevronDownIcon
            className={`transition-transform ${showDropdown ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && !isLoading && (
        <div
          className={`
            absolute z-50 mt-2 w-56 rounded-xl shadow-lg
            border overflow-hidden
            ${
              theme === "dark"
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-gray-200"
            }
          `}
          role="listbox"
          aria-label={labels.selectSize}
        >
          <div className="py-1">
            {SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSizeSelect(option.value)}
                className={`
                  w-full px-4 py-3 flex items-center gap-3 text-left
                  transition-colors
                  ${
                    option.value === selectedSize
                      ? theme === "dark"
                        ? "bg-slate-700"
                        : "bg-blue-50"
                      : theme === "dark"
                        ? "hover:bg-slate-700/50"
                        : "hover:bg-gray-50"
                  }
                `}
                role="option"
                aria-selected={option.value === selectedSize}
              >
                <span className="text-xl" aria-hidden="true">
                  {option.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className={`
                      font-medium text-sm
                      ${theme === "dark" ? "text-slate-100" : "text-gray-900"}
                    `}
                  >
                    {locale === "ko" ? option.labelKo : option.labelEn}
                  </div>
                  <div
                    className={`
                      text-xs truncate
                      ${theme === "dark" ? "text-slate-400" : "text-gray-500"}
                    `}
                  >
                    {locale === "ko"
                      ? option.descriptionKo
                      : option.descriptionEn}
                  </div>
                </div>
                {option.value === selectedSize && (
                  <CheckIcon
                    className={
                      theme === "dark" ? "text-blue-400" : "text-blue-600"
                    }
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className={`
            absolute z-40 mt-2 w-56 px-3 py-2 rounded-lg text-sm
            ${
              theme === "dark"
                ? "bg-red-900/50 text-red-300 border border-red-800"
                : "bg-red-50 text-red-700 border border-red-200"
            }
          `}
          role="alert"
        >
          {error.message}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default DownloadButton;
