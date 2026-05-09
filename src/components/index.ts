/**
 * Components Index
 *
 * Central export point for all UI components.
 *
 * Performance Note:
 * - Light components (autocomplete, date-picker): Imported directly
 * - Heavy components (chart, result, share buttons): Available as lazy versions
 * - Use Lazy* versions to reduce first-load JS bundle
 */

// =============================================================================
// Light Components (Direct Import)
// =============================================================================

export { StockAutocomplete } from "./stock-autocomplete";
export type { StockAutocompleteProps } from "./stock-autocomplete";

export { DatePicker } from "./date-picker";
export type { DatePickerProps } from "./date-picker";

export { PnLSummaryPanel } from "./pnl-summary-panel";
export type { PnLSummaryPanelProps } from "./pnl-summary-panel";

// =============================================================================
// Heavy Components (Direct Import - use Lazy* versions for better perf)
// =============================================================================

export { PriceHistoryChart } from "./price-history-chart";
export type { PriceHistoryChartProps } from "./price-history-chart";

export {
  ResultVisualizationContainer,
  ResultVisualizationSkeleton,
} from "./result-visualization-container";
export type {
  ResultVisualizationContainerProps,
  ResultVisualizationSkeletonProps,
} from "./result-visualization-container";

export {
  ShareButton,
  DownloadButton as ShareDownloadButton,
  CopyButton,
  WebShareButton,
} from "./share-button";
export type { ShareButtonProps } from "./share-button";

export {
  DownloadButton,
  DownloadButtonSimple,
} from "./download-button";
export type {
  DownloadButtonProps,
  DownloadButtonSimpleProps,
} from "./download-button";

export {
  ClipboardCopyButton,
  ClipboardCopyButtonCompact,
  ClipboardCopyButtonPrimary,
  isClipboardImageSupported,
} from "./clipboard-copy-button";
export type {
  ClipboardCopyButtonProps,
  CopyState,
} from "./clipboard-copy-button";

// =============================================================================
// Lazy-Loaded Components (Recommended for initial page load optimization)
// =============================================================================

export {
  // Lazy components
  LazyPriceHistoryChart,
  LazyPriceHistoryChartWithHeight,
  LazyResultVisualizationContainer,
  LazyShareButton,
  LazyDownloadButton,
  LazyDownloadButtonSimple,
  LazyClipboardCopyButton,
  LazyCopyButton,
  LazyWebShareButton,
  // Skeleton components for custom loading states
  ChartSkeleton,
  ResultSkeleton,
  ButtonSkeleton,
} from "./lazy";
