"use client";

/**
 * Lazy-loaded Components
 *
 * Dynamic imports for heavy components to reduce first-load JS bundle.
 * These components are loaded on-demand when needed, improving initial page load.
 *
 * Heavy components that benefit from lazy loading:
 * - PriceHistoryChart: Uses lightweight-charts (~130KB)
 * - ResultVisualizationContainer: Includes chart + complex layouts
 * - Share/Download buttons: Only needed for result display
 */

import dynamic from "next/dynamic";
import type { PriceHistoryChartProps } from "./price-history-chart";

// =============================================================================
// Loading Skeletons
// =============================================================================

/**
 * Chart loading skeleton with animated pulse
 */
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg bg-gray-200"
      style={{ height: `${height}px` }}
      role="status"
      aria-label="Loading chart..."
    >
      <span className="sr-only">Loading chart...</span>
    </div>
  );
}

/**
 * Result card loading skeleton
 */
function ResultSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
      role="status"
      aria-label="Loading result..."
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 rounded bg-gray-300" />
          <div className="h-4 w-12 rounded bg-gray-300" />
        </div>
        <div className="h-4 w-24 rounded bg-gray-300" />
      </div>

      {/* Meme copy area */}
      <div className="flex flex-col items-center gap-2 px-4 py-6">
        <div className="h-8 w-48 rounded bg-gray-300" />
        <div className="h-5 w-36 rounded bg-gray-300" />
      </div>

      {/* Percentage */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="h-14 w-40 rounded-lg bg-gray-300" />
        <div className="h-8 w-24 rounded-full bg-gray-300" />
      </div>

      {/* Chart area */}
      <div className="px-4 pb-4">
        <div className="h-60 rounded-xl bg-gray-300" />
      </div>

      {/* Summary */}
      <div className="px-4 pb-4">
        <div className="h-16 rounded-xl bg-gray-300" />
      </div>

      <span className="sr-only">Loading result...</span>
    </div>
  );
}

/**
 * Button loading skeleton
 */
function ButtonSkeleton({ width = 120 }: { width?: number }) {
  return (
    <div
      className="inline-flex animate-pulse items-center justify-center rounded-xl bg-gray-200"
      style={{ width: `${width}px`, height: "42px" }}
      role="status"
      aria-label="Loading button..."
    >
      <span className="sr-only">Loading button...</span>
    </div>
  );
}

// =============================================================================
// Dynamically Imported Components
// =============================================================================

/**
 * Lazy-loaded PriceHistoryChart
 *
 * This component imports the heavyweight lightweight-charts library (~130KB).
 * Only loaded when chart needs to be displayed.
 */
export const LazyPriceHistoryChart = dynamic(
  () => import("./price-history-chart").then((mod) => mod.PriceHistoryChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // lightweight-charts requires browser APIs
  }
);

/**
 * Lazy-loaded PriceHistoryChart with custom height
 *
 * This wrapper allows passing height to both the loading skeleton
 * and the actual chart component.
 */
export function LazyPriceHistoryChartWithHeight(props: PriceHistoryChartProps) {
  const chartHeight = props.height ?? 300;
  const DynamicChart = dynamic(
    () => import("./price-history-chart").then((mod) => mod.PriceHistoryChart),
    {
      loading: () => <ChartSkeleton height={chartHeight} />,
      ssr: false,
    }
  );
  return <DynamicChart {...props} />;
}

/**
 * Lazy-loaded ResultVisualizationContainer
 *
 * Includes the chart component and complex styling logic.
 * Only loaded when showing calculation results.
 */
export const LazyResultVisualizationContainer = dynamic(
  () =>
    import("./result-visualization-container").then(
      (mod) => mod.ResultVisualizationContainer
    ),
  {
    loading: () => <ResultSkeleton />,
    ssr: false, // Contains chart which needs browser APIs
  }
);

/**
 * Lazy-loaded ShareButton
 *
 * Includes share image generation logic with canvas/FontFace APIs.
 * Only loaded when share functionality is needed.
 */
export const LazyShareButton = dynamic(
  () => import("./share-button").then((mod) => mod.ShareButton),
  {
    loading: () => <ButtonSkeleton width={120} />,
    ssr: false, // Requires clipboard/share APIs
  }
);

/**
 * Lazy-loaded DownloadButton
 *
 * Includes share image generation with size selector.
 */
export const LazyDownloadButton = dynamic(
  () => import("./download-button").then((mod) => mod.DownloadButton),
  {
    loading: () => <ButtonSkeleton width={140} />,
    ssr: false,
  }
);

/**
 * Lazy-loaded DownloadButtonSimple
 */
export const LazyDownloadButtonSimple = dynamic(
  () => import("./download-button").then((mod) => mod.DownloadButtonSimple),
  {
    loading: () => <ButtonSkeleton width={140} />,
    ssr: false,
  }
);

/**
 * Lazy-loaded ClipboardCopyButton
 */
export const LazyClipboardCopyButton = dynamic(
  () => import("./clipboard-copy-button").then((mod) => mod.ClipboardCopyButton),
  {
    loading: () => <ButtonSkeleton width={120} />,
    ssr: false,
  }
);

/**
 * Lazy-loaded CopyButton (from share-button)
 */
export const LazyCopyButton = dynamic(
  () => import("./share-button").then((mod) => mod.CopyButton),
  {
    loading: () => <ButtonSkeleton width={100} />,
    ssr: false,
  }
);

/**
 * Lazy-loaded WebShareButton
 */
export const LazyWebShareButton = dynamic(
  () => import("./share-button").then((mod) => mod.WebShareButton),
  {
    loading: () => <ButtonSkeleton width={100} />,
    ssr: false,
  }
);

// =============================================================================
// Export Skeletons for External Use
// =============================================================================

export { ChartSkeleton, ResultSkeleton, ButtonSkeleton };
