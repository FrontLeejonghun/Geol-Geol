"use client";

/**
 * Price History Chart Component
 *
 * Displays stock price history using TradingView's Lightweight Charts.
 * Features:
 * - Line chart with price data over time
 * - Buy point marker highlighting the purchase date
 * - Dark/light theme support
 * - Responsive design (mobile-first)
 */

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type RefObject,
} from "react";
import {
  createChart,
  createSeriesMarkers,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type LineData,
  type Time,
  ColorType,
  CrosshairMode,
  LineStyle,
} from "lightweight-charts";
import type { PriceHistory, Theme } from "@/types/stock";

// =============================================================================
// Types
// =============================================================================

export interface PriceHistoryChartProps {
  /** Price history data to display */
  priceHistory: PriceHistory;
  /** Buy date to highlight (ISO format YYYY-MM-DD) */
  buyDate: string;
  /** Past price on buy date for marker */
  pastPrice: number;
  /** Current/latest price */
  currentPrice: number;
  /** Theme for styling */
  theme?: Theme;
  /** Height of the chart in pixels */
  height?: number;
  /** Optional className for container */
  className?: string;
  /** Show price annotations on hover */
  showCrosshair?: boolean;
  /** Callback when user hovers over a price point */
  onPriceHover?: (price: number | null, date: string | null) => void;
}

// =============================================================================
// Theme Configuration
// =============================================================================

interface ChartTheme {
  backgroundColor: string;
  textColor: string;
  lineColor: string;
  areaTopColor: string;
  areaBottomColor: string;
  gridColor: string;
  crosshairColor: string;
  markerBorderColor: string;
  markerBackgroundColor: string;
  gainColor: string;
  lossColor: string;
}

const CHART_THEMES: Record<Theme, ChartTheme> = {
  light: {
    backgroundColor: "#ffffff",
    textColor: "#333333",
    lineColor: "#2563eb", // blue-600
    areaTopColor: "rgba(37, 99, 235, 0.4)",
    areaBottomColor: "rgba(37, 99, 235, 0.0)",
    gridColor: "rgba(0, 0, 0, 0.06)",
    crosshairColor: "#9ca3af",
    markerBorderColor: "#dc2626", // red-600
    markerBackgroundColor: "#fef2f2", // red-50
    gainColor: "#16a34a", // green-600
    lossColor: "#dc2626", // red-600
  },
  dark: {
    backgroundColor: "#0f172a", // slate-900
    textColor: "#e2e8f0", // slate-200
    lineColor: "#60a5fa", // blue-400
    areaTopColor: "rgba(96, 165, 250, 0.4)",
    areaBottomColor: "rgba(96, 165, 250, 0.0)",
    gridColor: "rgba(255, 255, 255, 0.06)",
    crosshairColor: "#6b7280",
    markerBorderColor: "#f87171", // red-400
    markerBackgroundColor: "rgba(248, 113, 113, 0.2)",
    gainColor: "#4ade80", // green-400
    lossColor: "#f87171", // red-400
  },
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert PriceHistory data to Lightweight Charts format
 */
function convertToChartData(priceHistory: PriceHistory): LineData<Time>[] {
  return priceHistory.data.map((point) => ({
    time: point.date as Time,
    value: point.close,
  }));
}

/**
 * Format price for tooltip display
 */
function formatPrice(
  price: number,
  currency: string,
  locale: string = "ko-KR"
): string {
  const fractionDigits = currency === "KRW" ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(price);
}

// =============================================================================
// Custom Hook for Chart Management
// =============================================================================

function useChart(
  containerRef: RefObject<HTMLDivElement | null>,
  theme: Theme,
  height: number,
  showCrosshair: boolean
): {
  chart: IChartApi | null;
  lineSeries: ISeriesApi<"Line", Time> | null;
  markersPlugin: ISeriesMarkersPluginApi<Time> | null;
} {
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [lineSeries, setLineSeries] = useState<ISeriesApi<"Line", Time> | null>(null);
  const [markersPlugin, setMarkersPlugin] = useState<ISeriesMarkersPluginApi<Time> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chartTheme = CHART_THEMES[theme];

    // Create chart instance
    const newChart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: chartTheme.backgroundColor },
        textColor: chartTheme.textColor,
        fontFamily:
          "'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      width: container.clientWidth,
      height,
      grid: {
        vertLines: { color: chartTheme.gridColor },
        horzLines: { color: chartTheme.gridColor },
      },
      crosshair: {
        mode: showCrosshair ? CrosshairMode.Normal : CrosshairMode.Hidden,
        vertLine: {
          color: chartTheme.crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: chartTheme.backgroundColor,
        },
        horzLine: {
          color: chartTheme.crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: chartTheme.backgroundColor,
        },
      },
      timeScale: {
        borderColor: chartTheme.gridColor,
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: chartTheme.gridColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: false,
        },
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });

    // Create line series using new API (lightweight-charts v5)
    const newLineSeries = newChart.addSeries(LineSeries, {
      color: chartTheme.lineColor,
      lineWidth: 2,
      crosshairMarkerVisible: showCrosshair,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: chartTheme.lineColor,
      crosshairMarkerBackgroundColor: chartTheme.backgroundColor,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Create markers plugin for buy point marker
    const newMarkersPlugin = createSeriesMarkers(newLineSeries, []);

    setChart(newChart);
    setLineSeries(newLineSeries);
    setMarkersPlugin(newMarkersPlugin);

    // Cleanup on unmount
    return () => {
      newChart.remove();
      setChart(null);
      setLineSeries(null);
      setMarkersPlugin(null);
    };
  }, [containerRef, theme, height, showCrosshair]);

  return { chart, lineSeries, markersPlugin };
}

// =============================================================================
// Resize Hook
// =============================================================================

function useChartResize(
  containerRef: RefObject<HTMLDivElement | null>,
  chart: IChartApi | null
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !chart) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          chart.applyOptions({ width });
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, chart]);
}

// =============================================================================
// Main Component
// =============================================================================

export function PriceHistoryChart({
  priceHistory,
  buyDate,
  pastPrice,
  currentPrice,
  theme = "light",
  height = 300,
  className = "",
  showCrosshair = true,
  onPriceHover,
}: PriceHistoryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { chart, lineSeries, markersPlugin } = useChart(
    containerRef,
    theme,
    height,
    showCrosshair
  );

  // Handle resize
  useChartResize(containerRef, chart);

  // Set chart data and markers
  useEffect(() => {
    if (!lineSeries || !chart || !markersPlugin) return;

    const chartData = convertToChartData(priceHistory);
    lineSeries.setData(chartData);

    // Add buy point marker using markers plugin (lightweight-charts v5)
    const chartTheme = CHART_THEMES[theme];
    const isGain = currentPrice >= pastPrice;

    markersPlugin.setMarkers([
      {
        time: buyDate as Time,
        position: "belowBar",
        color: isGain ? chartTheme.gainColor : chartTheme.lossColor,
        shape: "arrowUp",
        text: "BUY",
      },
    ]);

    // Fit content to view
    chart.timeScale().fitContent();
  }, [lineSeries, chart, markersPlugin, priceHistory, buyDate, pastPrice, currentPrice, theme]);

  // Handle crosshair move for price hover callback
  const handleCrosshairMove = useCallback(
    (param: { time?: Time; seriesData: Map<ISeriesApi<"Line", Time>, LineData<Time>> }) => {
      if (!onPriceHover || !lineSeries) return;

      if (!param.time) {
        onPriceHover(null, null);
        return;
      }

      const data = param.seriesData.get(lineSeries);
      if (data && "value" in data) {
        onPriceHover(data.value, param.time as string);
      }
    },
    [onPriceHover, lineSeries]
  );

  useEffect(() => {
    if (!chart || !onPriceHover) return;

    chart.subscribeCrosshairMove(handleCrosshairMove as Parameters<IChartApi["subscribeCrosshairMove"]>[0]);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove as Parameters<IChartApi["unsubscribeCrosshairMove"]>[0]);
    };
  }, [chart, handleCrosshairMove, onPriceHover]);

  // Calculate gain/loss for legend display
  const priceChange = currentPrice - pastPrice;
  const percentChange = ((priceChange / pastPrice) * 100).toFixed(2);
  const isGain = priceChange >= 0;
  const chartTheme = CHART_THEMES[theme];

  return (
    <div className={`relative ${className}`}>
      {/* Chart container */}
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
        role="img"
        aria-label={`Price chart showing ${priceHistory.ticker} from ${priceHistory.startDate} to ${priceHistory.endDate}`}
      />

      {/* Legend overlay */}
      <div
        className="absolute top-2 left-2 p-2 rounded-md text-xs font-medium"
        style={{
          backgroundColor:
            theme === "dark"
              ? "rgba(15, 23, 42, 0.8)"
              : "rgba(255, 255, 255, 0.9)",
          color: chartTheme.textColor,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{priceHistory.ticker}</span>
          <span
            className="text-sm"
            style={{ color: isGain ? chartTheme.gainColor : chartTheme.lossColor }}
          >
            {isGain ? "+" : ""}
            {percentChange}%
          </span>
        </div>
        <div className="text-xs opacity-70 mt-0.5">
          {formatPrice(currentPrice, priceHistory.currency)}
        </div>
      </div>

      {/* Buy marker legend */}
      <div
        className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs flex items-center gap-1.5"
        style={{
          backgroundColor:
            theme === "dark"
              ? "rgba(15, 23, 42, 0.8)"
              : "rgba(255, 255, 255, 0.9)",
          color: chartTheme.textColor,
        }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{
            backgroundColor: isGain
              ? chartTheme.gainColor
              : chartTheme.lossColor,
          }}
        />
        <span>
          Buy: {buyDate} @ {formatPrice(pastPrice, priceHistory.currency)}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Export Default
// =============================================================================

export default PriceHistoryChart;
