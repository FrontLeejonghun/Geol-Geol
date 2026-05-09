/**
 * Canvas Renderer for Share Image Generation
 *
 * Renders a shareable PNG image using HTMLCanvasElement/OffscreenCanvas.
 * Supports two sizes:
 * - 1080x1350: Instagram portrait (4:5)
 * - 1200x630: Open Graph / Twitter Card (landscape)
 */

import type {
  ShareImageSize,
  ShareImageInput,
  PricePoint,
  Locale,
} from "@/types/stock";
import { getShareImageDimensions } from "@/types/stock";
import { formatPercent, formatCurrency } from "@/lib/format";
import { getFontString, loadShareImageFonts } from "./fonts";
import { getCanvasTheme, getOutcomeLabel, getBrandingText, type CanvasTheme } from "./themes";

// =============================================================================
// Types
// =============================================================================

interface RenderContext {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  width: number;
  height: number;
  theme: CanvasTheme;
  locale: Locale;
  scale: number;
}

interface TextMetrics {
  width: number;
  height: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Draw rounded rectangle
 */
function roundRect(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draw gradient background
 */
function drawBackground(ctx: RenderContext): void {
  const { ctx: c, width, height, theme } = ctx;
  const gradient = c.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, theme.gradient[0]);
  gradient.addColorStop(0.5, theme.gradient[1]);
  gradient.addColorStop(1, theme.gradient[2]);
  c.fillStyle = gradient;
  c.fillRect(0, 0, width, height);
}

/**
 * Draw text with optional max width (ellipsis if overflow)
 */
function drawText(
  ctx: RenderContext,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = "center",
  maxWidth?: number
): TextMetrics {
  const { ctx: c } = ctx;
  c.font = font;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = "middle";

  let displayText = text;
  if (maxWidth) {
    const metrics = c.measureText(text);
    if (metrics.width > maxWidth) {
      // Truncate with ellipsis
      while (c.measureText(displayText + "...").width > maxWidth && displayText.length > 0) {
        displayText = displayText.slice(0, -1);
      }
      displayText += "...";
    }
  }

  c.fillText(displayText, x, y, maxWidth);

  const metrics = c.measureText(displayText);
  return {
    width: metrics.width,
    height: parseInt(font.match(/\d+/)?.[0] || "16", 10),
  };
}

/**
 * Draw sparkline chart
 */
function drawSparkline(
  ctx: RenderContext,
  data: PricePoint[],
  x: number,
  y: number,
  width: number,
  height: number,
  buyDateIndex: number
): void {
  if (data.length < 2) return;

  const { ctx: c, theme } = ctx;
  const prices = data.map((p) => p.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Calculate points
  const points: { x: number; y: number }[] = data.map((point, i) => ({
    x: x + (i / (data.length - 1)) * width,
    y: y + height - ((point.close - minPrice) / priceRange) * height,
  }));

  // Draw fill gradient
  const gradient = c.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, theme.chartFill[0]);
  gradient.addColorStop(1, theme.chartFill[1]);

  c.beginPath();
  c.moveTo(points[0]!.x, points[0]!.y);
  for (let i = 1; i < points.length; i++) {
    c.lineTo(points[i]!.x, points[i]!.y);
  }
  c.lineTo(points[points.length - 1]!.x, y + height);
  c.lineTo(points[0]!.x, y + height);
  c.closePath();
  c.fillStyle = gradient;
  c.fill();

  // Draw line
  c.beginPath();
  c.moveTo(points[0]!.x, points[0]!.y);
  for (let i = 1; i < points.length; i++) {
    c.lineTo(points[i]!.x, points[i]!.y);
  }
  c.strokeStyle = theme.chartLine;
  c.lineWidth = 3;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.stroke();

  // Draw buy date marker
  if (buyDateIndex >= 0 && buyDateIndex < points.length) {
    const markerPoint = points[buyDateIndex]!;

    // Outer glow
    c.beginPath();
    c.arc(markerPoint.x, markerPoint.y, 10, 0, Math.PI * 2);
    c.fillStyle = theme.markerColor + "40";
    c.fill();

    // Inner dot
    c.beginPath();
    c.arc(markerPoint.x, markerPoint.y, 6, 0, Math.PI * 2);
    c.fillStyle = theme.markerColor;
    c.fill();

    // White center
    c.beginPath();
    c.arc(markerPoint.x, markerPoint.y, 3, 0, Math.PI * 2);
    c.fillStyle = "#FFFFFF";
    c.fill();
  }
}

/**
 * Draw outcome badge (icon + label)
 */
function drawBadge(
  ctx: RenderContext,
  x: number,
  y: number,
  label: string,
  icon: string
): { width: number; height: number } {
  const { ctx: c, theme, locale, scale } = ctx;

  const fontSize = 18 * scale;
  const iconSize = 22 * scale;
  const paddingX = 16 * scale;
  const paddingY = 8 * scale;
  const gap = 6 * scale;
  const radius = 20 * scale;

  // Measure text
  c.font = getFontString(locale, 600, fontSize);
  const textWidth = c.measureText(label).width;
  const totalWidth = paddingX * 2 + iconSize + gap + textWidth;
  const totalHeight = paddingY * 2 + Math.max(iconSize, fontSize);

  // Draw background
  roundRect(c, x - totalWidth / 2, y - totalHeight / 2, totalWidth, totalHeight, radius);
  c.fillStyle = theme.badgeBg;
  c.fill();

  // Draw icon
  c.font = `${iconSize}px sans-serif`;
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillText(icon, x - totalWidth / 2 + paddingX, y);

  // Draw label
  c.font = getFontString(locale, 600, fontSize);
  c.fillStyle = theme.badgeText;
  c.textAlign = "left";
  c.fillText(label, x - totalWidth / 2 + paddingX + iconSize + gap, y);

  return { width: totalWidth, height: totalHeight };
}

/**
 * Draw branding footer
 */
function drawBranding(
  ctx: RenderContext,
  x: number,
  y: number,
  width: number
): void {
  const { ctx: c, theme, locale, scale } = ctx;
  const branding = getBrandingText(locale);

  const titleSize = 24 * scale;
  const taglineSize = 14 * scale;
  const gap = 10 * scale;

  // Draw title
  c.font = getFontString(locale, 700, titleSize);
  c.fillStyle = theme.primaryText;
  c.textAlign = "center";
  c.textBaseline = "middle";
  const titleMetrics = c.measureText(branding.title);

  // Draw tagline
  c.font = getFontString(locale, 400, taglineSize);
  c.fillStyle = theme.mutedText;
  const taglineMetrics = c.measureText(branding.tagline);

  const totalWidth = titleMetrics.width + gap + taglineMetrics.width;
  const startX = x + (width - totalWidth) / 2;

  // Draw title
  c.font = getFontString(locale, 700, titleSize);
  c.fillStyle = theme.primaryText;
  c.textAlign = "left";
  c.fillText(branding.title, startX, y);

  // Draw tagline
  c.font = getFontString(locale, 400, taglineSize);
  c.fillStyle = theme.mutedText;
  c.fillText(branding.tagline, startX + titleMetrics.width + gap, y);
}

// =============================================================================
// Portrait Layout (1080x1350)
// =============================================================================

function renderPortrait(
  ctx: RenderContext,
  input: ShareImageInput
): void {
  const { width, height, scale, locale, theme } = ctx;
  const { stock, buyDate, pastPrice, currentPrice, pnl, memeCopy, priceHistory } = input;

  // Draw background
  drawBackground(ctx);

  // Layout constants (all scaled)
  const padding = 60 * scale;
  const sectionGap = 40 * scale;

  let currentY = padding;

  // === Header Section ===
  const headerHeight = 50 * scale;

  // Ticker
  drawText(
    ctx,
    stock.ticker,
    padding,
    currentY + headerHeight / 2,
    getFontString(locale, 600, 24 * scale),
    theme.primaryText,
    "left"
  );

  // Exchange badge
  ctx.ctx.font = getFontString(locale, 500, 14 * scale);
  const exchangeWidth = ctx.ctx.measureText(stock.exchange).width + 16 * scale;
  roundRect(
    ctx.ctx,
    padding + ctx.ctx.measureText(stock.ticker).width + 12 * scale,
    currentY + headerHeight / 2 - 12 * scale,
    exchangeWidth,
    24 * scale,
    6 * scale
  );
  ctx.ctx.fillStyle = theme.cardBg;
  ctx.ctx.fill();
  drawText(
    ctx,
    stock.exchange,
    padding + ctx.ctx.measureText(stock.ticker).width + 12 * scale + exchangeWidth / 2,
    currentY + headerHeight / 2,
    getFontString(locale, 500, 14 * scale),
    theme.mutedText,
    "center"
  );

  // Buy date
  const dateLabel = locale === "ko" ? "매수일" : "Buy Date";
  drawText(
    ctx,
    `${dateLabel}: ${buyDate}`,
    width - padding,
    currentY + headerHeight / 2,
    getFontString(locale, 400, 16 * scale),
    theme.mutedText,
    "right"
  );

  currentY += headerHeight + sectionGap;

  // === Meme Copy Section ===
  // Headline
  drawText(
    ctx,
    memeCopy.headline,
    width / 2,
    currentY,
    getFontString(locale, 700, 48 * scale),
    theme.primaryText,
    "center",
    width - padding * 2
  );
  currentY += 60 * scale;

  // Subline
  drawText(
    ctx,
    memeCopy.subline,
    width / 2,
    currentY,
    getFontString(locale, 500, 24 * scale),
    theme.secondaryText,
    "center",
    width - padding * 2
  );
  currentY += sectionGap + 20 * scale;

  // === Percentage Section ===
  const formattedPercent = formatPercent(pnl.percent, locale);
  drawText(
    ctx,
    formattedPercent,
    width / 2,
    currentY,
    getFontString(locale, 700, 80 * scale),
    theme.percentText,
    "center"
  );
  currentY += 100 * scale;

  // Outcome badge
  const outcomeLabel = getOutcomeLabel(pnl.outcomeTier, locale);
  drawBadge(ctx, width / 2, currentY, outcomeLabel, theme.icon);
  currentY += sectionGap + 20 * scale;

  // === Chart Section ===
  const chartHeight = 280 * scale;
  const chartPadding = 20 * scale;

  // Chart card background
  roundRect(
    ctx.ctx,
    padding,
    currentY,
    width - padding * 2,
    chartHeight + chartPadding * 2,
    16 * scale
  );
  ctx.ctx.fillStyle = theme.cardBg;
  ctx.ctx.fill();
  ctx.ctx.strokeStyle = theme.borderColor;
  ctx.ctx.lineWidth = 1;
  ctx.ctx.stroke();

  // Draw sparkline
  if (priceHistory && priceHistory.data.length > 0) {
    const buyDateIndex = priceHistory.data.findIndex((p) => p.date === buyDate);
    drawSparkline(
      ctx,
      priceHistory.data,
      padding + chartPadding,
      currentY + chartPadding,
      width - padding * 2 - chartPadding * 2,
      chartHeight,
      buyDateIndex >= 0 ? buyDateIndex : 0
    );
  }

  currentY += chartHeight + chartPadding * 2 + sectionGap;

  // === Summary Section ===
  const summaryHeight = 80 * scale;
  roundRect(
    ctx.ctx,
    padding,
    currentY,
    width - padding * 2,
    summaryHeight,
    12 * scale
  );
  ctx.ctx.fillStyle = theme.cardBg;
  ctx.ctx.fill();

  // Summary content
  const col1X = padding + (width - padding * 2) / 4;
  const col2X = padding + (width - padding * 2) / 2;
  const col3X = padding + ((width - padding * 2) * 3) / 4;
  const labelY = currentY + 25 * scale;
  const valueY = currentY + 55 * scale;

  // Past price
  const pastLabel = locale === "ko" ? "매수가" : "Past";
  drawText(ctx, pastLabel, col1X, labelY, getFontString(locale, 400, 14 * scale), theme.mutedText, "center");
  drawText(
    ctx,
    formatCurrency(pastPrice, pnl.currency, locale),
    col1X,
    valueY,
    getFontString(locale, 600, 18 * scale),
    theme.primaryText,
    "center"
  );

  // Current price
  const currentLabel = locale === "ko" ? "현재가" : "Current";
  drawText(ctx, currentLabel, col2X, labelY, getFontString(locale, 400, 14 * scale), theme.mutedText, "center");
  drawText(
    ctx,
    formatCurrency(currentPrice, pnl.currency, locale),
    col2X,
    valueY,
    getFontString(locale, 600, 18 * scale),
    theme.primaryText,
    "center"
  );

  // Change
  const changeLabel = locale === "ko" ? "변동" : "Change";
  drawText(ctx, changeLabel, col3X, labelY, getFontString(locale, 400, 14 * scale), theme.mutedText, "center");
  const changeText = pnl.absolute !== null
    ? formatCurrency(pnl.absolute, pnl.currency, locale)
    : formatPercent(pnl.percent, locale);
  drawText(
    ctx,
    changeText,
    col3X,
    valueY,
    getFontString(locale, 600, 18 * scale),
    theme.percentText,
    "center"
  );

  currentY += summaryHeight + sectionGap;

  // === Branding Footer ===
  drawBranding(ctx, padding, height - padding - 20 * scale, width - padding * 2);
}

// =============================================================================
// Landscape Layout (1200x630)
// =============================================================================

function renderLandscape(
  ctx: RenderContext,
  input: ShareImageInput
): void {
  const { width, height, scale, locale, theme } = ctx;
  const { stock, buyDate, pnl, memeCopy, priceHistory } = input;

  // Draw background
  drawBackground(ctx);

  // Layout constants
  const padding = 50 * scale;
  const leftWidth = width * 0.45;
  const rightWidth = width * 0.55 - padding;

  // === Left Side: Meme Copy + Stats ===
  let leftY = padding + 40 * scale;

  // Meme headline
  drawText(
    ctx,
    memeCopy.headline,
    leftWidth / 2,
    leftY,
    getFontString(locale, 700, 42 * scale),
    theme.primaryText,
    "center",
    leftWidth - padding
  );
  leftY += 60 * scale;

  // Meme subline
  drawText(
    ctx,
    memeCopy.subline,
    leftWidth / 2,
    leftY,
    getFontString(locale, 500, 20 * scale),
    theme.secondaryText,
    "center",
    leftWidth - padding
  );
  leftY += 50 * scale;

  // Percentage
  const formattedPercent = formatPercent(pnl.percent, locale);
  drawText(
    ctx,
    formattedPercent,
    leftWidth / 2,
    leftY,
    getFontString(locale, 700, 64 * scale),
    theme.percentText,
    "center"
  );
  leftY += 80 * scale;

  // Outcome badge
  const outcomeLabel = getOutcomeLabel(pnl.outcomeTier, locale);
  drawBadge(ctx, leftWidth / 2, leftY, outcomeLabel, theme.icon);
  leftY += 60 * scale;

  // Stock info
  drawText(
    ctx,
    `${stock.ticker} | ${buyDate}`,
    leftWidth / 2,
    leftY,
    getFontString(locale, 400, 18 * scale),
    theme.mutedText,
    "center"
  );

  // === Right Side: Chart ===
  const chartX = leftWidth + padding / 2;
  const chartY = padding + 20 * scale;
  const chartWidth = rightWidth - padding;
  const chartHeight = height - padding * 2 - 80 * scale;

  // Chart background
  roundRect(ctx.ctx, chartX, chartY, chartWidth, chartHeight, 16 * scale);
  ctx.ctx.fillStyle = theme.cardBg;
  ctx.ctx.fill();
  ctx.ctx.strokeStyle = theme.borderColor;
  ctx.ctx.lineWidth = 1;
  ctx.ctx.stroke();

  // Draw sparkline
  if (priceHistory && priceHistory.data.length > 0) {
    const chartPadding = 20 * scale;
    const buyDateIndex = priceHistory.data.findIndex((p) => p.date === buyDate);
    drawSparkline(
      ctx,
      priceHistory.data,
      chartX + chartPadding,
      chartY + chartPadding,
      chartWidth - chartPadding * 2,
      chartHeight - chartPadding * 2,
      buyDateIndex >= 0 ? buyDateIndex : 0
    );
  }

  // === Branding ===
  drawBranding(ctx, chartX, height - padding, chartWidth);
}

// =============================================================================
// Main Renderer
// =============================================================================

/**
 * Render share image to canvas
 *
 * @param input - Share image input data
 * @param size - Target size ('1080x1350' or '1200x630')
 * @returns Promise resolving to canvas element
 */
export async function renderShareImage(
  input: ShareImageInput,
  size: ShareImageSize
): Promise<HTMLCanvasElement> {
  // Ensure fonts are loaded
  await loadShareImageFonts();

  const dimensions = getShareImageDimensions(size);
  const { width, height } = dimensions;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas 2D context");
  }

  // Get theme
  const theme = getCanvasTheme(input.pnl.outcomeTier, input.theme);

  // Create render context
  const renderCtx: RenderContext = {
    ctx,
    width,
    height,
    theme,
    locale: input.locale,
    scale: width / 1080, // Base scale on 1080px width
  };

  // Render based on layout
  if (size === "1200x630") {
    renderLandscape(renderCtx, input);
  } else {
    renderPortrait(renderCtx, input);
  }

  return canvas;
}

/**
 * Render share image using OffscreenCanvas (for web workers)
 *
 * @param input - Share image input data
 * @param size - Target size
 * @returns Promise resolving to OffscreenCanvas
 */
export async function renderShareImageOffscreen(
  input: ShareImageInput,
  size: ShareImageSize
): Promise<OffscreenCanvas> {
  const dimensions = getShareImageDimensions(size);
  const { width, height } = dimensions;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get OffscreenCanvas 2D context");
  }

  // Get theme
  const theme = getCanvasTheme(input.pnl.outcomeTier, input.theme);

  // Create render context
  const renderCtx: RenderContext = {
    ctx,
    width,
    height,
    theme,
    locale: input.locale,
    scale: width / 1080,
  };

  // Render based on layout
  if (size === "1200x630") {
    renderLandscape(renderCtx, input);
  } else {
    renderPortrait(renderCtx, input);
  }

  return canvas;
}
