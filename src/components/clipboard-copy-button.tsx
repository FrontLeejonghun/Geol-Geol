"use client";

/**
 * Clipboard Copy Button Component
 *
 * A specialized button component for copying generated share images to clipboard
 * for SNS sharing. Features:
 * - Clipboard API integration with image/png support
 * - Visual feedback for copy states (idle, copying, success, error)
 * - Fallback UI when clipboard is not supported
 * - Full accessibility support (ARIA, keyboard navigation)
 * - Localized labels (ko/en)
 * - Auto-reset success state after timeout
 */

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent,
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

export interface ClipboardCopyButtonProps {
  /** Calculation result to generate share image from */
  result: CalculationResult;
  /** Theme for share image styling */
  theme?: Theme;
  /** Locale for formatting and labels */
  locale?: Locale;
  /** Image size preset */
  size?: ShareImageSize;
  /** Custom button content (replaces default label) */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Show compact version (icon only) */
  compact?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Duration to show success state (ms) */
  successDuration?: number;
  /** Callback when copy succeeds */
  onSuccess?: () => void;
  /** Callback when copy fails */
  onError?: (error: Error) => void;
  /** Callback when clipboard is not supported */
  onUnsupported?: () => void;
  /** Disable the button */
  disabled?: boolean;
  /** Aria label for accessibility */
  "aria-label"?: string;
}

export type CopyState = "idle" | "copying" | "success" | "error" | "unsupported";

// =============================================================================
// Labels
// =============================================================================

interface Labels {
  copy: string;
  copying: string;
  copied: string;
  error: string;
  unsupported: string;
  copyToClipboard: string;
}

const LABELS: Record<Locale, Labels> = {
  ko: {
    copy: "복사하기",
    copying: "복사 중...",
    copied: "복사 완료!",
    error: "복사 실패",
    unsupported: "지원 안함",
    copyToClipboard: "클립보드에 이미지 복사",
  },
  en: {
    copy: "Copy",
    copying: "Copying...",
    copied: "Copied!",
    error: "Copy failed",
    unsupported: "Not supported",
    copyToClipboard: "Copy image to clipboard",
  },
};

// =============================================================================
// Icons
// =============================================================================

function CopyIcon({ className = "" }: { className?: string }) {
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
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

function ClipboardXIcon({ className = "" }: { className?: string }) {
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
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l6-6m-6 0l6 6"
      />
    </svg>
  );
}

// =============================================================================
// Hook: useClipboardCopy
// =============================================================================

interface UseClipboardCopyOptions {
  result: CalculationResult;
  theme: Theme;
  locale: Locale;
  size: ShareImageSize;
  successDuration: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onUnsupported?: () => void;
}

interface UseClipboardCopyReturn {
  copyState: CopyState;
  isSupported: boolean;
  copy: () => Promise<void>;
  reset: () => void;
}

function useClipboardCopy({
  result,
  theme,
  locale,
  size,
  successDuration,
  onSuccess,
  onError,
  onUnsupported,
}: UseClipboardCopyOptions): UseClipboardCopyReturn {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    clipboardSupported,
    generateFromResult,
    copy: copyToClipboard,
    reset: resetShareImage,
  } = useShareImage({ theme, locale, defaultSize: size });

  // Check clipboard support on mount
  const isSupported = clipboardSupported;

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setCopyState("idle");
    resetShareImage();
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, [resetShareImage]);

  const copy = useCallback(async () => {
    // Check clipboard support
    if (!isSupported) {
      setCopyState("unsupported");
      onUnsupported?.();
      return;
    }

    // Clear any existing timeouts
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    try {
      setCopyState("copying");

      // Generate the image
      const image = await generateFromResult(result, size);
      if (!image) {
        throw new Error("Failed to generate image");
      }

      // Copy to clipboard (pass image directly to avoid React state race)
      const success = await copyToClipboard(image);
      if (!success) {
        throw new Error("Failed to copy to clipboard");
      }

      // Success!
      setCopyState("success");
      onSuccess?.();

      // Auto-reset after timeout
      successTimeoutRef.current = setTimeout(() => {
        setCopyState("idle");
      }, successDuration);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setCopyState("error");
      onError?.(error);

      // Auto-reset error state after a shorter timeout
      errorTimeoutRef.current = setTimeout(() => {
        setCopyState("idle");
      }, 3000);
    }
  }, [
    isSupported,
    result,
    size,
    generateFromResult,
    copyToClipboard,
    successDuration,
    onSuccess,
    onError,
    onUnsupported,
  ]);

  return {
    copyState,
    isSupported,
    copy,
    reset,
  };
}

// =============================================================================
// Component
// =============================================================================

/**
 * Clipboard Copy Button for SNS Sharing
 *
 * Generates a share image from calculation results and copies it to the
 * clipboard using the Clipboard API. Provides visual feedback for all
 * states and gracefully handles unsupported browsers.
 *
 * @example
 * ```tsx
 * <ClipboardCopyButton
 *   result={calculationResult}
 *   theme="dark"
 *   locale="ko"
 *   size="1080x1350"
 *   onSuccess={() => toast.success("Copied!")}
 * />
 * ```
 */
export function ClipboardCopyButton({
  result,
  theme = "light",
  locale = "ko",
  size = "1080x1350",
  children,
  className = "",
  compact = false,
  successMessage,
  successDuration = 2000,
  onSuccess,
  onError,
  onUnsupported,
  disabled = false,
  "aria-label": ariaLabelProp,
}: ClipboardCopyButtonProps) {
  const labels = LABELS[locale];
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { copyState, isSupported, copy } = useClipboardCopy({
    result,
    theme,
    locale,
    size,
    successDuration,
    onSuccess,
    onError,
    onUnsupported,
  });

  // Handle click
  const handleClick = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (disabled || copyState === "copying") return;
      await copy();
    },
    [disabled, copyState, copy]
  );

  // Handle keyboard
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (disabled || copyState === "copying") return;
        await copy();
      }
    },
    [disabled, copyState, copy]
  );

  // Get icon based on state
  const getIcon = useCallback(() => {
    switch (copyState) {
      case "copying":
        return <SpinnerIcon />;
      case "success":
        return <CheckIcon className="text-green-500" />;
      case "error":
        return <AlertIcon className="text-red-500" />;
      case "unsupported":
        return <ClipboardXIcon className="text-gray-500" />;
      default:
        return <CopyIcon />;
    }
  }, [copyState]);

  // Get label based on state
  const getLabel = useCallback(() => {
    if (children) return children;
    switch (copyState) {
      case "copying":
        return labels.copying;
      case "success":
        return successMessage ?? labels.copied;
      case "error":
        return labels.error;
      case "unsupported":
        return labels.unsupported;
      default:
        return labels.copy;
    }
  }, [children, copyState, labels, successMessage]);

  // Get aria-label
  const ariaLabel =
    ariaLabelProp ?? (copyState === "idle" ? labels.copyToClipboard : undefined);

  // Get button styles based on state and theme
  const getButtonStyles = useCallback(() => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      rounded-xl font-medium transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      ${compact ? "p-2.5" : "px-4 py-2.5"}
    `;

    const disabledStyles = disabled
      ? "opacity-50 cursor-not-allowed"
      : "cursor-pointer";

    let stateStyles: string;
    switch (copyState) {
      case "copying":
        stateStyles =
          theme === "dark"
            ? "bg-slate-600 text-slate-300 cursor-wait"
            : "bg-gray-200 text-gray-600 cursor-wait";
        break;
      case "success":
        stateStyles =
          "bg-green-500 text-white focus:ring-green-500 hover:bg-green-600";
        break;
      case "error":
        stateStyles =
          theme === "dark"
            ? "bg-red-900/50 text-red-400 border border-red-800 hover:bg-red-900/70 focus:ring-red-500"
            : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus:ring-red-500";
        break;
      case "unsupported":
        stateStyles =
          theme === "dark"
            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
            : "bg-gray-100 text-gray-500 cursor-not-allowed";
        break;
      default:
        stateStyles =
          theme === "dark"
            ? "bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-slate-500 focus:ring-offset-slate-900"
            : "bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500";
    }

    return `${baseStyles} ${stateStyles} ${disabledStyles} ${className}`;
  }, [compact, disabled, copyState, theme, className]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || copyState === "copying" || !isSupported}
      className={getButtonStyles()}
      aria-label={ariaLabel}
      aria-busy={copyState === "copying"}
      aria-live="polite"
      aria-disabled={disabled || !isSupported}
      title={!isSupported ? labels.unsupported : undefined}
    >
      {getIcon()}
      {!compact && <span>{getLabel()}</span>}
    </button>
  );
}

// =============================================================================
// Compound Components
// =============================================================================

/**
 * Compact icon-only clipboard copy button
 */
export function ClipboardCopyButtonCompact(
  props: Omit<ClipboardCopyButtonProps, "compact">
) {
  return <ClipboardCopyButton {...props} compact />;
}

/**
 * Clipboard copy button with custom styling for primary action
 */
export function ClipboardCopyButtonPrimary({
  className = "",
  theme = "light",
  ...props
}: ClipboardCopyButtonProps) {
  const primaryStyles =
    theme === "dark"
      ? "bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500"
      : "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500";

  return (
    <ClipboardCopyButton
      {...props}
      theme={theme}
      className={`${primaryStyles} ${className}`}
    />
  );
}

// =============================================================================
// Utility Exports
// =============================================================================

/**
 * Check if the Clipboard API with image support is available
 */
export function isClipboardImageSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!("clipboard" in navigator)) return false;
  if (!("write" in navigator.clipboard)) return false;

  // Check if ClipboardItem is supported
  if (typeof ClipboardItem === "undefined") return false;

  return true;
}

// =============================================================================
// Export
// =============================================================================

export default ClipboardCopyButton;
