/**
 * Font Loading Utility for Share Image Canvas Rendering
 *
 * Handles FontFace loading for Pretendard (KO) and Inter (EN)
 * before canvas rendering to ensure proper text display.
 */

// =============================================================================
// Types
// =============================================================================

export interface FontSpec {
  family: string;
  weight: string;
  style: string;
  url: string;
}

export interface LoadedFonts {
  ko: string; // Pretendard font family
  en: string; // Inter font family
}

// =============================================================================
// Font URLs (CDN-hosted)
// =============================================================================

// Pretendard font from CDN (Korean support)
const PRETENDARD_FONTS: FontSpec[] = [
  {
    family: "Pretendard",
    weight: "400",
    style: "normal",
    url: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff2/Pretendard-Regular.woff2",
  },
  {
    family: "Pretendard",
    weight: "500",
    style: "normal",
    url: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff2/Pretendard-Medium.woff2",
  },
  {
    family: "Pretendard",
    weight: "600",
    style: "normal",
    url: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff2/Pretendard-SemiBold.woff2",
  },
  {
    family: "Pretendard",
    weight: "700",
    style: "normal",
    url: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff2/Pretendard-Bold.woff2",
  },
];

// Inter font from CDN (English support)
const INTER_FONTS: FontSpec[] = [
  {
    family: "Inter",
    weight: "400",
    style: "normal",
    url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf",
  },
  {
    family: "Inter",
    weight: "500",
    style: "normal",
    url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf",
  },
  {
    family: "Inter",
    weight: "600",
    style: "normal",
    url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf",
  },
  {
    family: "Inter",
    weight: "700",
    style: "normal",
    url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf",
  },
];

// =============================================================================
// Font Loading State
// =============================================================================

let fontsLoaded = false;
let fontsLoadingPromise: Promise<LoadedFonts> | null = null;

// =============================================================================
// Font Loading Functions
// =============================================================================

/**
 * Load a single font using FontFace API
 */
async function loadFont(spec: FontSpec): Promise<FontFace> {
  const font = new FontFace(spec.family, `url(${spec.url})`, {
    weight: spec.weight,
    style: spec.style,
    display: "swap",
  });

  const loadedFont = await font.load();
  document.fonts.add(loadedFont);
  return loadedFont;
}

/**
 * Load all required fonts for share image rendering
 *
 * This should be called before any canvas rendering that uses text.
 * The function is idempotent - calling it multiple times will only load fonts once.
 *
 * @returns Promise resolving to font family names for ko and en
 */
export async function loadShareImageFonts(): Promise<LoadedFonts> {
  // Return cached result if already loaded
  if (fontsLoaded) {
    return { ko: "Pretendard", en: "Inter" };
  }

  // Return existing promise if loading is in progress
  if (fontsLoadingPromise) {
    return fontsLoadingPromise;
  }

  // Start loading fonts. Use allSettled so a single CDN failure
  // doesn't break the whole image generation.
  fontsLoadingPromise = (async () => {
    const allFonts = [...PRETENDARD_FONTS, ...INTER_FONTS];
    const results = await Promise.allSettled(allFonts.map(loadFont));
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.warn(
        `[share-image fonts] ${failed.length}/${allFonts.length} font(s) failed to load; canvas will fall back to system fonts.`,
        failed.map((r) => (r as PromiseRejectedResult).reason?.message)
      );
    }
    fontsLoaded = true;
    return { ko: "Pretendard", en: "Inter" };
  })();

  return fontsLoadingPromise;
}

/**
 * Check if fonts are already loaded
 */
export function areFontsLoaded(): boolean {
  return fontsLoaded;
}

/**
 * Get font family string for canvas context
 *
 * @param locale - 'ko' for Korean (Pretendard) or 'en' for English (Inter)
 * @param weight - Font weight (400, 500, 600, 700)
 * @param size - Font size in pixels
 * @returns Font string for canvas context.font
 */
export function getFontString(
  locale: "ko" | "en",
  weight: number,
  size: number
): string {
  const family = locale === "ko" ? "Pretendard" : "Inter";
  // Map weight number to CSS weight keyword for canvas
  const weightMap: Record<number, string> = {
    400: "normal",
    500: "500",
    600: "600",
    700: "bold",
  };
  const fontWeight = weightMap[weight] || "normal";

  return `${fontWeight} ${size}px ${family}, sans-serif`;
}

/**
 * Preload fonts without blocking
 * Use this for eager loading on app initialization
 */
export function preloadFonts(): void {
  loadShareImageFonts().catch((error) => {
    console.warn("Failed to preload share image fonts:", error);
  });
}
