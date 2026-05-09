"use client";

/**
 * Share Button Component
 *
 * A reusable button component for sharing calculation results as PNG images.
 * Provides download, copy, and web share functionality based on device capabilities.
 */

import { useState, useCallback, type ReactNode } from "react";
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

export interface ShareButtonProps {
  /** Calculation result to generate share image from */
  result: CalculationResult;
  /** Theme for share image styling */
  theme?: Theme;
  /** Locale for formatting */
  locale?: Locale;
  /** Image size preset */
  size?: ShareImageSize;
  /** Button variant */
  variant?: "download" | "copy" | "share" | "auto";
  /** Custom button content */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Callback when share action completes */
  onComplete?: (action: "download" | "copy" | "share") => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

// =============================================================================
// Icons
// =============================================================================

function DownloadIcon() {
  return (
    <svg
      className="w-5 h-5"
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

function CopyIcon() {
  return (
    <svg
      className="w-5 h-5"
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

function ShareIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5"
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

function SpinnerIcon() {
  return (
    <svg
      className="w-5 h-5 animate-spin"
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

// =============================================================================
// Component
// =============================================================================

export function ShareButton({
  result,
  theme = "light",
  locale = "ko",
  size = "1080x1350",
  variant = "auto",
  children,
  className = "",
  onComplete,
  onError,
}: ShareButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    isGenerating,
    isDownloading,
    isCopying,
    isSharing,
    error,
    clipboardSupported,
    webShareSupported,
    generateFromResult,
    download,
    copy,
    share,
  } = useShareImage({ theme, locale, defaultSize: size });

  // Determine action based on variant and capabilities
  const getAction = useCallback((): "download" | "copy" | "share" => {
    if (variant !== "auto") return variant;
    // Auto: prefer share > copy > download based on availability
    if (webShareSupported) return "share";
    if (clipboardSupported) return "copy";
    return "download";
  }, [variant, webShareSupported, clipboardSupported]);

  const action = getAction();

  // Handle button click
  const handleClick = useCallback(async () => {
    try {
      // Generate image first
      const image = await generateFromResult(result, size);
      if (!image) return;

      // Execute action — pass the freshly generated image to avoid the
      // React-state race where setImage hasn't propagated yet.
      let success = true;
      switch (action) {
        case "download":
          await download(undefined, image);
          break;
        case "copy":
          success = await copy(image);
          break;
        case "share":
          success = await share(
            {
              title:
                locale === "ko"
                  ? "껄껄 - 그때 살껄..."
                  : "GeolGeol - Should've bought...",
              text:
                locale === "ko"
                  ? "나의 투자 결과를 확인해보세요!"
                  : "Check out my investment result!",
            },
            image
          );
          break;
      }

      if (success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        onComplete?.(action);
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      onError?.(e);
    }
  }, [generateFromResult, result, size, action, download, copy, share, locale, onComplete, onError]);

  // Loading state
  const isLoading = isGenerating || isDownloading || isCopying || isSharing;

  // Get icon based on state and action
  const getIcon = () => {
    if (isLoading) return <SpinnerIcon />;
    if (showSuccess) return <CheckIcon />;
    switch (action) {
      case "download":
        return <DownloadIcon />;
      case "copy":
        return <CopyIcon />;
      case "share":
        return <ShareIcon />;
    }
  };

  // Get label based on action and locale
  const getLabel = () => {
    if (children) return children;
    if (isLoading) return locale === "ko" ? "생성 중..." : "Generating...";
    if (showSuccess) return locale === "ko" ? "완료!" : "Done!";
    switch (action) {
      case "download":
        return locale === "ko" ? "이미지 저장" : "Download";
      case "copy":
        return locale === "ko" ? "복사하기" : "Copy";
      case "share":
        return locale === "ko" ? "공유하기" : "Share";
    }
  };

  // Get aria-label based on action and state
  const getAriaLabel = () => {
    if (isLoading) return locale === "ko" ? "생성 중..." : "Generating...";
    if (showSuccess) return locale === "ko" ? "완료!" : "Done!";
    switch (action) {
      case "download":
        return locale === "ko" ? "이미지 저장" : "Download image";
      case "copy":
        return locale === "ko" ? "클립보드에 이미지 복사" : "Copy image to clipboard";
      case "share":
        return locale === "ko" ? "이미지 공유하기" : "Share image";
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2.5
        rounded-xl font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${
          showSuccess
            ? "bg-green-500 text-white focus:ring-green-500"
            : theme === "dark"
              ? "bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-slate-500 focus:ring-offset-slate-900"
              : "bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500"
        }
        ${isLoading ? "cursor-wait opacity-75" : "cursor-pointer"}
        ${error ? "ring-2 ring-red-500" : ""}
        ${className}
      `}
      title={error?.message}
      aria-label={getAriaLabel()}
      aria-busy={isLoading}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </button>
  );
}

// =============================================================================
// Compound Components for Specific Actions
// =============================================================================

export function DownloadButton(props: Omit<ShareButtonProps, "variant">) {
  return <ShareButton {...props} variant="download" />;
}

export function CopyButton(props: Omit<ShareButtonProps, "variant">) {
  return <ShareButton {...props} variant="copy" />;
}

export function WebShareButton(props: Omit<ShareButtonProps, "variant">) {
  return <ShareButton {...props} variant="share" />;
}

export default ShareButton;
