/**
 * OG Image Generation Module
 *
 * Server-side OG image generation with @vercel/og (satori).
 * Supports Korean fonts (Pretendard) and multiple image sizes.
 *
 * @example
 * ```tsx
 * import { generateOgImage } from "@/lib/og-image";
 *
 * export async function GET(request: Request) {
 *   const input = {
 *     stock: { ticker: "005930.KS", ... },
 *     pnl: { percent: 150, outcomeTier: "jackpot", ... },
 *     memeCopy: { headline: "...", subline: "..." },
 *     theme: "light",
 *     locale: "ko",
 *   };
 *
 *   return generateOgImage(input, { size: "1200x630" });
 * }
 * ```
 */

// Font loading utilities
export {
  loadOgImageFonts,
  loadMinimalOgFonts,
  loadPretendardFonts,
  loadInterFonts,
  getOgFontFamily,
  clearFontCache,
  getFontCacheStats,
  type FontData,
  type LoadedFonts,
} from "./fonts";

// Theme utilities
export {
  getOgTheme,
  getOgOutcomeLabel,
  getOgBrandingText,
  type OgTheme,
} from "./themes";

// Image generation
export {
  generateOgImage,
  generateOpenGraphImage,
  generateSocialShareImage,
  type OgImageInput,
  type GenerateOgImageOptions,
} from "./generator";
