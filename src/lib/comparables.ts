import type { Locale, StockCurrency } from "@/types/stock";

interface ComparableItem {
  emoji: string;
  ko: string;
  en: string;
  /** approximate retail price in 2026 KRW */
  priceKrw: number;
  /** approximate retail price in 2026 USD */
  priceUsd: number;
}

const ITEMS: ComparableItem[] = [
  { emoji: "🍗", ko: "치킨", en: "fried chicken", priceKrw: 22_000, priceUsd: 18 },
  { emoji: "☕", ko: "스타벅스 라떼", en: "Starbucks latte", priceKrw: 5_800, priceUsd: 6 },
  { emoji: "🍔", ko: "빅맥 세트", en: "Big Mac meal", priceKrw: 8_500, priceUsd: 11 },
  { emoji: "🥩", ko: "한우 1kg", en: "wagyu beef (kg)", priceKrw: 90_000, priceUsd: 70 },
  { emoji: "📱", ko: "아이폰 16 Pro", en: "iPhone 16 Pro", priceKrw: 1_550_000, priceUsd: 1_000 },
  { emoji: "🚗", ko: "아반떼", en: "Hyundai Elantra", priceKrw: 22_000_000, priceUsd: 22_000 },
  { emoji: "🏠", ko: "서울 아파트 평수", en: "Seoul apartment (1 pyeong)", priceKrw: 35_000_000, priceUsd: 27_000 },
];

export interface ComparableLine {
  emoji: string;
  label: string;
  /** Localized count string e.g. "1,234마리" or "1,234 chickens" */
  text: string;
  /** Numeric count, used for ordering */
  count: number;
}

function pickPrice(item: ComparableItem, currency: StockCurrency): number {
  return currency === "KRW" ? item.priceKrw : item.priceUsd;
}

function unitFor(item: ComparableItem, locale: Locale): string {
  if (locale !== "ko") return item.en;
  if (item.ko === "치킨") return "마리";
  if (item.ko === "스타벅스 라떼") return "잔";
  if (item.ko === "빅맥 세트") return "세트";
  if (item.ko === "한우 1kg") return "kg";
  if (item.ko === "서울 아파트 평수") return "평";
  return "대";
}

/**
 * Translate an absolute gain/loss amount into 2-3 culturally relatable units.
 *
 * Picks items where the count lands in a memorable range (>= 1, ideally
 * not absurd 8-digit numbers). Returns up to 3 lines.
 */
export function buildComparables(
  absoluteAmount: number,
  currency: StockCurrency,
  locale: Locale
): ComparableLine[] {
  const amount = Math.abs(absoluteAmount);
  if (amount <= 0) return [];

  type Scored = { line: ComparableLine; score: number };
  const scored: Scored[] = [];

  for (const item of ITEMS) {
    const price = pickPrice(item, currency);
    if (price <= 0) continue;
    const count = amount / price;
    if (count < 1) continue;

    const rounded = count >= 100 ? Math.round(count) : Math.round(count * 10) / 10;
    const numberFormatter = new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
      maximumFractionDigits: count >= 100 ? 0 : 1,
    });
    const formatted = numberFormatter.format(rounded);
    const unit = unitFor(item, locale);

    const text =
      locale === "ko"
        ? `${item.ko} ${formatted}${unit}`
        : `${formatted} ${unit}`;

    // Score: prefer counts near 1..10000 (sweet spot)
    const score =
      count >= 1 && count < 5
        ? 100
        : count < 50
          ? 90
          : count < 1000
            ? 80
            : count < 100_000
              ? 60
              : 30;

    scored.push({
      line: { emoji: item.emoji, label: locale === "ko" ? item.ko : item.en, text, count },
      score,
    });
  }

  // Sort by score desc, then by count desc (bigger absolute count is more impactful)
  scored.sort((a, b) => b.score - a.score || b.line.count - a.line.count);

  // Diversify: skip near-duplicate item categories by uniquing on label
  const seen = new Set<string>();
  const result: ComparableLine[] = [];
  for (const s of scored) {
    if (seen.has(s.line.label)) continue;
    seen.add(s.line.label);
    result.push(s.line);
    if (result.length >= 3) break;
  }
  return result;
}
