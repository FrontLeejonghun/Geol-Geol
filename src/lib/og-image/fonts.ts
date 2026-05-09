/**
 * Server-Side Font Loading for OG Image Generation
 *
 * Handles font loading and embedding for @vercel/og (satori) rendering.
 * Supports Pretendard (Korean) and Inter (English) fonts with multiple weights.
 *
 * Fonts are fetched from CDN and cached in memory for reuse.
 */

// =============================================================================
// Types
// =============================================================================

export interface FontData {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal";
}

export interface LoadedFonts {
  fonts: FontData[];
  primaryKo: string;
  primaryEn: string;
}

// =============================================================================
// Font URLs (CDN-hosted)
// =============================================================================

/**
 * Pretendard font specifications for Korean text rendering
 * Using jsdelivr CDN for reliable global distribution
 * Note: The correct path includes /packages/pretendard/ prefix
 */
const PRETENDARD_FONT_URLS: Record<400 | 500 | 600 | 700, string> = {
  400: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/Pretendard-Regular.woff",
  500: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/Pretendard-Medium.woff",
  600: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/Pretendard-SemiBold.woff",
  700: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/Pretendard-Bold.woff",
};

/**
 * Inter font specifications for English text rendering
 * Using jsdelivr CDN with Inter npm package
 * Note: satori only supports .woff and .otf/.ttf formats, NOT .woff2
 */
const INTER_FONT_URLS: Record<400 | 500 | 600 | 700, string> = {
  400: "https://cdn.jsdelivr.net/npm/inter-ui@3.19.3/Inter (web)/Inter-Regular.woff",
  500: "https://cdn.jsdelivr.net/npm/inter-ui@3.19.3/Inter (web)/Inter-Medium.woff",
  600: "https://cdn.jsdelivr.net/npm/inter-ui@3.19.3/Inter (web)/Inter-SemiBold.woff",
  700: "https://cdn.jsdelivr.net/npm/inter-ui@3.19.3/Inter (web)/Inter-Bold.woff",
};

// =============================================================================
// Font Cache
// =============================================================================

/**
 * In-memory font cache for server-side reuse
 * Prevents redundant network requests across multiple OG image generations
 */
const fontCache = new Map<string, ArrayBuffer>();

// =============================================================================
// Font Loading Functions
// =============================================================================

/**
 * Fetch a single font file from CDN
 * Returns cached result if available
 */
async function fetchFont(url: string): Promise<ArrayBuffer> {
  // Check cache first
  const cached = fontCache.get(url);
  if (cached) {
    return cached;
  }

  // Fetch from CDN
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${url} (${response.status})`);
  }

  const buffer = await response.arrayBuffer();

  // Cache for reuse
  fontCache.set(url, buffer);

  return buffer;
}

/**
 * Load Pretendard fonts for Korean text rendering
 *
 * @param weights - Array of font weights to load (default: all weights)
 * @returns Array of FontData objects for satori
 */
export async function loadPretendardFonts(
  weights: (400 | 500 | 600 | 700)[] = [400, 500, 600, 700]
): Promise<FontData[]> {
  const fonts = await Promise.all(
    weights.map(async (weight) => {
      const url = PRETENDARD_FONT_URLS[weight];
      const data = await fetchFont(url);
      return {
        name: "Pretendard",
        data,
        weight,
        style: "normal" as const,
      };
    })
  );
  return fonts;
}

/**
 * Load Inter fonts for English text rendering
 *
 * @param weights - Array of font weights to load (default: all weights)
 * @returns Array of FontData objects for satori
 */
export async function loadInterFonts(
  weights: (400 | 500 | 600 | 700)[] = [400, 500, 600, 700]
): Promise<FontData[]> {
  const fonts = await Promise.all(
    weights.map(async (weight) => {
      const url = INTER_FONT_URLS[weight];
      const data = await fetchFont(url);
      return {
        name: "Inter",
        data,
        weight,
        style: "normal" as const,
      };
    })
  );
  return fonts;
}

/**
 * Load all required fonts for OG image generation
 *
 * Loads both Pretendard (Korean) and Inter (English) fonts.
 * Results are cached in memory for subsequent calls.
 *
 * @param options - Optional configuration
 * @returns Object containing font data and family names
 */
export async function loadOgImageFonts(options?: {
  /** Which font weights to load (default: [400, 600, 700]) */
  weights?: (400 | 500 | 600 | 700)[];
  /** Whether to load Korean fonts (default: true) */
  includeKorean?: boolean;
  /** Whether to load English fonts (default: true) */
  includeEnglish?: boolean;
}): Promise<LoadedFonts> {
  const {
    weights = [400, 600, 700],
    includeKorean = true,
    includeEnglish = true,
  } = options ?? {};

  const fontPromises: Promise<FontData[]>[] = [];

  if (includeKorean) {
    fontPromises.push(loadPretendardFonts(weights));
  }

  if (includeEnglish) {
    fontPromises.push(loadInterFonts(weights));
  }

  const fontArrays = await Promise.all(fontPromises);
  const fonts = fontArrays.flat();

  return {
    fonts,
    primaryKo: "Pretendard",
    primaryEn: "Inter",
  };
}

/**
 * Load minimal fonts for fast OG image generation
 *
 * Only loads the most commonly used weights (400, 700)
 * for better edge function performance.
 */
export async function loadMinimalOgFonts(): Promise<LoadedFonts> {
  return loadOgImageFonts({ weights: [400, 700] });
}

/**
 * Get font family string for satori styles
 *
 * @param locale - 'ko' for Korean-first or 'en' for English-first
 * @returns Font family string with appropriate fallbacks
 */
export function getOgFontFamily(locale: "ko" | "en"): string {
  if (locale === "ko") {
    return "Pretendard, Inter, sans-serif";
  }
  return "Inter, Pretendard, sans-serif";
}

/**
 * Clear font cache
 * Useful for testing or memory management
 */
export function clearFontCache(): void {
  fontCache.clear();
}

/**
 * Get cache statistics
 */
export function getFontCacheStats(): { size: number; keys: string[] } {
  return {
    size: fontCache.size,
    keys: Array.from(fontCache.keys()),
  };
}
