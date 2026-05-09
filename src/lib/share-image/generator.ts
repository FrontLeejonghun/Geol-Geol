/**
 * Share Image Generator
 *
 * High-level API for generating shareable PNG images from calculation results.
 * Provides utilities for:
 * - Generating PNG as Blob and data URL
 * - Downloading image to user's device
 * - Copying image to clipboard
 * - Web Share API integration
 */

import type {
  ShareImage,
  ShareImageSize,
  ShareImageInput,
  CalculationResult,
  Theme,
  Locale,
} from "@/types/stock";
import { renderShareImage } from "./canvas-renderer";

// =============================================================================
// Types
// =============================================================================

export interface GenerateImageOptions {
  /** Image size preset */
  size: ShareImageSize;
  /** Quality for JPEG compression (0-1), ignored for PNG */
  quality?: number;
}

export interface ShareImageResult extends ShareImage {
  /** Canvas element used for rendering (available for further manipulation) */
  canvas: HTMLCanvasElement;
}

export interface DownloadOptions {
  /** Custom filename (without extension) */
  filename?: string;
}

export interface WebShareOptions {
  /** Share title */
  title?: string;
  /** Share text/description */
  text?: string;
}

// =============================================================================
// Image Generation
// =============================================================================

/**
 * Generate share image from input data
 *
 * @param input - Share image input data
 * @param options - Generation options
 * @returns Promise resolving to ShareImageResult with blob, dataUrl, and canvas
 */
export async function generateShareImage(
  input: ShareImageInput,
  options: GenerateImageOptions
): Promise<ShareImageResult> {
  const { size } = options;

  // Render to canvas
  const canvas = await renderShareImage(input, size);

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      "image/png",
      1.0 // Max quality for PNG
    );
  });

  // Generate data URL
  const dataUrl = canvas.toDataURL("image/png", 1.0);

  return {
    size,
    blob,
    dataUrl,
    canvas,
  };
}

/**
 * Generate share image from calculation result
 *
 * Convenience function that extracts ShareImageInput from CalculationResult
 *
 * @param result - Calculation result
 * @param theme - Theme for styling
 * @param locale - Locale for formatting
 * @param options - Generation options
 * @returns Promise resolving to ShareImageResult
 */
export async function generateShareImageFromResult(
  result: CalculationResult,
  theme: Theme,
  locale: Locale,
  options: GenerateImageOptions
): Promise<ShareImageResult> {
  const input: ShareImageInput = {
    stock: result.stock,
    buyDate: result.resolvedBuyDate,
    pastPrice: result.pastPrice,
    currentPrice: result.currentPrice,
    pnl: result.pnl,
    memeCopy: result.memeCopy,
    priceHistory: result.priceHistory,
    theme,
    locale,
  };

  return generateShareImage(input, options);
}

// =============================================================================
// Download
// =============================================================================

/**
 * Download share image to user's device using blob URL
 *
 * Uses URL.createObjectURL for memory-efficient downloads on desktop browsers.
 * The blob URL is automatically revoked after download to prevent memory leaks.
 *
 * @param image - Share image result
 * @param options - Download options
 */
export function downloadShareImage(
  image: ShareImageResult,
  options: DownloadOptions = {}
): void {
  const { filename = generateFilename(image.size) } = options;

  // Create blob URL for efficient download
  const blobUrl = URL.createObjectURL(image.blob);

  // Create anchor element for download trigger
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `${filename}.png`;

  // Set link attributes for accessibility and styling (invisible)
  link.style.display = "none";
  link.setAttribute("aria-hidden", "true");

  // Append to body, trigger click, and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke blob URL to free memory
  // Use setTimeout to ensure download starts before revoking
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 100);
}

/**
 * Download share image directly from input
 *
 * Convenience function that generates and downloads in one step
 */
export async function generateAndDownload(
  input: ShareImageInput,
  options: GenerateImageOptions & DownloadOptions
): Promise<void> {
  const image = await generateShareImage(input, options);
  downloadShareImage(image, options);
}

/**
 * Generate default filename based on timestamp and size
 */
function generateFilename(size: ShareImageSize): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const sizeLabel = size === "1080x1350" ? "portrait" : "og";
  return `geolgeol-${sizeLabel}-${timestamp}`;
}

/**
 * Check if blob URL downloads are supported
 *
 * Returns true for modern desktop browsers that support:
 * - URL.createObjectURL
 * - HTML5 download attribute
 * - Programmatic anchor click
 */
export function isBlobDownloadSupported(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  // Check for URL.createObjectURL support
  if (!("URL" in window) || typeof URL.createObjectURL !== "function") {
    return false;
  }

  // Check for download attribute support
  const link = document.createElement("a");
  return "download" in link;
}

/**
 * Download share image with fallback to data URL
 *
 * Uses blob URL for efficiency when supported, falls back to data URL otherwise.
 * This provides compatibility with older browsers while preferring the more
 * memory-efficient blob URL approach.
 *
 * @param image - Share image result
 * @param options - Download options
 */
export function downloadShareImageWithFallback(
  image: ShareImageResult,
  options: DownloadOptions = {}
): void {
  const { filename = generateFilename(image.size) } = options;

  // Use blob URL for modern desktop browsers (preferred)
  if (isBlobDownloadSupported()) {
    downloadShareImage(image, options);
    return;
  }

  // Fallback: use data URL for older browsers
  const link = document.createElement("a");
  link.href = image.dataUrl;
  link.download = `${filename}.png`;
  link.style.display = "none";
  link.setAttribute("aria-hidden", "true");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// =============================================================================
// Clipboard
// =============================================================================

/**
 * Check if clipboard image writing is supported
 *
 * Uses navigator.clipboard.write() which is available on modern
 * desktop browsers (Chrome 66+, Firefox 63+, Safari 13.1+, Edge 79+).
 */
export function isClipboardSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "clipboard" in navigator &&
    navigator.clipboard != null &&
    "write" in navigator.clipboard
  );
}

/**
 * Copy share image to clipboard
 *
 * @param image - Share image result
 * @returns Promise resolving when copy is complete
 * @throws Error if clipboard API is not supported
 */
export async function copyToClipboard(image: ShareImageResult): Promise<void> {
  if (!isClipboardSupported()) {
    throw new Error("Clipboard API not supported");
  }

  const item = new ClipboardItem({
    "image/png": image.blob,
  });

  await navigator.clipboard.write([item]);
}

/**
 * Copy share image to clipboard directly from input
 *
 * Convenience function that generates and copies in one step
 */
export async function generateAndCopy(
  input: ShareImageInput,
  options: GenerateImageOptions
): Promise<void> {
  const image = await generateShareImage(input, options);
  await copyToClipboard(image);
}

// =============================================================================
// Web Share API
// =============================================================================

/**
 * Check if Web Share API with files is supported
 */
export function isWebShareSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    "canShare" in navigator
  );
}

/**
 * Check if the device can share files
 */
export function canShareFiles(): boolean {
  if (!isWebShareSupported()) return false;

  // Test if file sharing is supported
  const testFile = new File([""], "test.png", { type: "image/png" });
  return navigator.canShare({ files: [testFile] });
}

/**
 * Share image using Web Share API
 *
 * @param image - Share image result
 * @param options - Share options
 * @returns Promise resolving when share is complete or user cancels
 * @throws Error if Web Share API is not supported
 */
export async function shareImage(
  image: ShareImageResult,
  options: WebShareOptions = {}
): Promise<void> {
  if (!canShareFiles()) {
    throw new Error("Web Share API with file support not available");
  }

  const {
    title = "껄껄 - 그때 살껄...",
    text = "나의 투자 결과를 확인해보세요!",
  } = options;

  // Create file from blob
  const filename = generateFilename(image.size) + ".png";
  const file = new File([image.blob], filename, { type: "image/png" });

  // Share
  await navigator.share({
    title,
    text,
    files: [file],
  });
}

/**
 * Share image directly from input using Web Share API
 *
 * Convenience function that generates and shares in one step
 */
export async function generateAndShare(
  input: ShareImageInput,
  options: GenerateImageOptions & WebShareOptions
): Promise<void> {
  const image = await generateShareImage(input, options);
  await shareImage(image, options);
}

// =============================================================================
// Preload
// =============================================================================

/**
 * Preload fonts for faster share image generation
 *
 * Call this early in app lifecycle to ensure fonts are ready
 * when user wants to generate a share image.
 */
export async function preloadShareImageAssets(): Promise<void> {
  const { loadShareImageFonts } = await import("./fonts");
  await loadShareImageFonts();
}
