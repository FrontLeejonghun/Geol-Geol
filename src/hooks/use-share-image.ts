/**
 * useShareImage Hook
 *
 * React hook for generating and sharing PNG images from calculation results.
 * Provides a simple interface for:
 * - Generating share images
 * - Downloading images
 * - Copying to clipboard
 * - Web Share API integration
 * - Loading and error states
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  ShareImageSize,
  ShareImageInput,
  CalculationResult,
  Theme,
  Locale,
} from "@/types/stock";
import {
  generateShareImage,
  generateShareImageFromResult,
  downloadShareImage,
  copyToClipboard,
  shareImage,
  isClipboardSupported,
  canShareFiles,
  preloadShareImageAssets,
  type ShareImageResult,
  type DownloadOptions,
  type WebShareOptions,
} from "@/lib/share-image/generator";

// =============================================================================
// Types
// =============================================================================

export interface UseShareImageOptions {
  /** Preload fonts on hook mount */
  preloadOnMount?: boolean;
  /** Default image size */
  defaultSize?: ShareImageSize;
  /** Theme for share image */
  theme?: Theme;
  /** Locale for formatting */
  locale?: Locale;
}

export interface UseShareImageState {
  /** Current generated image (null if not generated yet) */
  image: ShareImageResult | null;
  /** Whether image generation is in progress */
  isGenerating: boolean;
  /** Whether download is in progress */
  isDownloading: boolean;
  /** Whether clipboard copy is in progress */
  isCopying: boolean;
  /** Whether web share is in progress */
  isSharing: boolean;
  /** Last error that occurred */
  error: Error | null;
  /** Whether clipboard API is supported */
  clipboardSupported: boolean;
  /** Whether Web Share API with files is supported */
  webShareSupported: boolean;
}

export interface UseShareImageActions {
  /** Generate share image from ShareImageInput */
  generate: (input: ShareImageInput, size?: ShareImageSize) => Promise<ShareImageResult | null>;
  /** Generate share image from CalculationResult */
  generateFromResult: (result: CalculationResult, size?: ShareImageSize) => Promise<ShareImageResult | null>;
  /** Download the current or generated image. If `target` is provided it overrides the state image (avoids the React state race after generate). */
  download: (options?: DownloadOptions, target?: ShareImageResult) => Promise<void>;
  /** Copy the current or generated image to clipboard. */
  copy: (target?: ShareImageResult) => Promise<boolean>;
  /** Share the current or generated image using Web Share API. */
  share: (options?: WebShareOptions, target?: ShareImageResult) => Promise<boolean>;
  /** Clear the current image and error state */
  reset: () => void;
  /** Generate and immediately download */
  generateAndDownload: (input: ShareImageInput, size?: ShareImageSize, downloadOptions?: DownloadOptions) => Promise<void>;
  /** Generate and immediately copy to clipboard */
  generateAndCopy: (input: ShareImageInput, size?: ShareImageSize) => Promise<boolean>;
  /** Generate and immediately share */
  generateAndShare: (input: ShareImageInput, size?: ShareImageSize, shareOptions?: WebShareOptions) => Promise<boolean>;
}

export type UseShareImageReturn = UseShareImageState & UseShareImageActions;

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for generating and sharing stock regret images
 *
 * @param options - Configuration options
 * @returns State and actions for share image generation
 *
 * @example
 * ```tsx
 * const {
 *   image,
 *   isGenerating,
 *   generate,
 *   download,
 *   copy,
 *   share,
 *   clipboardSupported,
 *   webShareSupported,
 * } = useShareImage({ theme: 'dark', locale: 'ko' });
 *
 * // Generate image
 * await generate(shareImageInput, '1080x1350');
 *
 * // Then download, copy, or share
 * await download();
 * await copy();
 * await share();
 * ```
 */
export function useShareImage(
  options: UseShareImageOptions = {}
): UseShareImageReturn {
  const {
    preloadOnMount = true,
    defaultSize = "1080x1350",
    theme = "light",
    locale = "ko",
  } = options;

  // State
  const [image, setImage] = useState<ShareImageResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [clipboardSupported, setClipboardSupported] = useState(false);
  const [webShareSupported, setWebShareSupported] = useState(false);

  // Check capabilities on mount
  useEffect(() => {
    setClipboardSupported(isClipboardSupported());
    setWebShareSupported(canShareFiles());

    // Preload fonts if requested
    if (preloadOnMount) {
      preloadShareImageAssets().catch((err) => {
        console.warn("Failed to preload share image assets:", err);
      });
    }
  }, [preloadOnMount]);

  // Generate from ShareImageInput
  const generate = useCallback(
    async (
      input: ShareImageInput,
      size: ShareImageSize = defaultSize
    ): Promise<ShareImageResult | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const result = await generateShareImage(input, { size });
        setImage(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [defaultSize]
  );

  // Generate from CalculationResult
  const generateFromResult = useCallback(
    async (
      result: CalculationResult,
      size: ShareImageSize = defaultSize
    ): Promise<ShareImageResult | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const imageResult = await generateShareImageFromResult(
          result,
          theme,
          locale,
          { size }
        );
        setImage(imageResult);
        return imageResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [defaultSize, theme, locale]
  );

  // Download current image
  const download = useCallback(
    async (
      downloadOptions?: DownloadOptions,
      target?: ShareImageResult
    ): Promise<void> => {
      const img = target ?? image;
      if (!img) {
        setError(new Error("No image generated. Call generate() first."));
        return;
      }

      setIsDownloading(true);
      setError(null);

      try {
        downloadShareImage(img, downloadOptions);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      } finally {
        setIsDownloading(false);
      }
    },
    [image]
  );

  // Copy to clipboard
  const copy = useCallback(
    async (target?: ShareImageResult): Promise<boolean> => {
      const img = target ?? image;
      if (!img) {
        setError(new Error("No image generated. Call generate() first."));
        return false;
      }

      if (!clipboardSupported) {
        setError(new Error("Clipboard API not supported on this device."));
        return false;
      }

      setIsCopying(true);
      setError(null);

      try {
        await copyToClipboard(img);
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return false;
      } finally {
        setIsCopying(false);
      }
    },
    [image, clipboardSupported]
  );

  // Share using Web Share API
  const share = useCallback(
    async (
      shareOptions?: WebShareOptions,
      target?: ShareImageResult
    ): Promise<boolean> => {
      const img = target ?? image;
      if (!img) {
        setError(new Error("No image generated. Call generate() first."));
        return false;
      }

      if (!webShareSupported) {
        setError(new Error("Web Share API not supported on this device."));
        return false;
      }

      setIsSharing(true);
      setError(null);

      try {
        await shareImage(img, shareOptions);
        return true;
      } catch (err) {
        // User cancellation is not an error
        if (err instanceof Error && err.name === "AbortError") {
          return false;
        }
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return false;
      } finally {
        setIsSharing(false);
      }
    },
    [image, webShareSupported]
  );

  // Reset state
  const reset = useCallback(() => {
    setImage(null);
    setError(null);
    setIsGenerating(false);
    setIsDownloading(false);
    setIsCopying(false);
    setIsSharing(false);
  }, []);

  // Generate and download in one step
  const generateAndDownload = useCallback(
    async (
      input: ShareImageInput,
      size: ShareImageSize = defaultSize,
      downloadOptions?: DownloadOptions
    ): Promise<void> => {
      const result = await generate(input, size);
      if (result) {
        downloadShareImage(result, downloadOptions);
      }
    },
    [generate, defaultSize]
  );

  // Generate and copy in one step
  const generateAndCopy = useCallback(
    async (
      input: ShareImageInput,
      size: ShareImageSize = defaultSize
    ): Promise<boolean> => {
      const result = await generate(input, size);
      if (result && clipboardSupported) {
        try {
          await copyToClipboard(result);
          return true;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          return false;
        }
      }
      return false;
    },
    [generate, defaultSize, clipboardSupported]
  );

  // Generate and share in one step
  const generateAndShare = useCallback(
    async (
      input: ShareImageInput,
      size: ShareImageSize = defaultSize,
      shareOptions?: WebShareOptions
    ): Promise<boolean> => {
      const result = await generate(input, size);
      if (result && webShareSupported) {
        try {
          await shareImage(result, shareOptions);
          return true;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            return false;
          }
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          return false;
        }
      }
      return false;
    },
    [generate, defaultSize, webShareSupported]
  );

  return {
    // State
    image,
    isGenerating,
    isDownloading,
    isCopying,
    isSharing,
    error,
    clipboardSupported,
    webShareSupported,
    // Actions
    generate,
    generateFromResult,
    download,
    copy,
    share,
    reset,
    generateAndDownload,
    generateAndCopy,
    generateAndShare,
  };
}

// =============================================================================
// Export
// =============================================================================

export default useShareImage;
