/**
 * Share Image Module
 *
 * Canvas-based PNG generation for shareable stock regret images.
 * Supports two sizes:
 * - 1080x1350: Instagram portrait (4:5)
 * - 1200x630: Open Graph / Twitter Card (landscape)
 */

// Font loading
export {
  loadShareImageFonts,
  areFontsLoaded,
  getFontString,
  preloadFonts,
  type FontSpec,
  type LoadedFonts,
} from "./fonts";

// Theme configuration
export {
  getCanvasTheme,
  getOutcomeLabel,
  getBrandingText,
  type CanvasTheme,
} from "./themes";

// Canvas rendering
export {
  renderShareImage,
  renderShareImageOffscreen,
} from "./canvas-renderer";

// Image generation and sharing
export {
  generateShareImage,
  generateShareImageFromResult,
  downloadShareImage,
  generateAndDownload,
  isClipboardSupported,
  copyToClipboard,
  generateAndCopy,
  isWebShareSupported,
  canShareFiles,
  shareImage,
  generateAndShare,
  preloadShareImageAssets,
  type GenerateImageOptions,
  type ShareImageResult,
  type DownloadOptions,
  type WebShareOptions,
} from "./generator";
