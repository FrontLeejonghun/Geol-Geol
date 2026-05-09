/**
 * Type tests for i18n message structure
 * This file verifies that IntlMessages types are correctly inferred.
 *
 * If this file compiles, the type system is correctly configured.
 * If you add a key here that doesn't exist in ko.json, TypeScript will error.
 */

import type ko from '../../messages/ko.json';

// Re-export for type checking
type Messages = typeof ko;

// Verify all top-level keys exist
type TopLevelKeys = keyof Messages;

// Verify nested structures
type CommonMessages = Messages['common'];
type HomeMessages = Messages['home'];
type ResultMessages = Messages['result'];
type OutcomeMessages = Messages['outcome'];
type ShareMessages = Messages['share'];
type SizeMessages = Messages['size'];
type MemeMessages = Messages['meme'];
type SearchMessages = Messages['search'];
type DateMessages = Messages['date'];
type ErrorMessages = Messages['error'];
type ChartMessages = Messages['chart'];
type AccessibilityMessages = Messages['accessibility'];
type FooterMessages = Messages['footer'];

// Meme outcome tiers - matches ontology outcomeTier concept
type MemeOutcomeTiers = keyof MemeMessages;

// Date presets
type DatePresets = Messages['date']['preset'];

// Verify meme tier content structure
type MemeContent = MemeMessages['jackpot'];

/**
 * Type assertion helpers - these will fail at compile time if keys are wrong
 * The 'as const' and satisfies pattern ensures compile-time validation
 */
export const MESSAGE_KEYS = {
  topLevel: [
    'common',
    'home',
    'result',
    'outcome',
    'share',
    'size',
    'meme',
    'search',
    'date',
    'error',
    'chart',
    'accessibility',
    'footer',
  ] as const satisfies readonly TopLevelKeys[],

  common: [
    'appName',
    'tagline',
    'loading',
    'calculating',
  ] as const satisfies readonly (keyof CommonMessages)[],

  home: [
    'title',
    'subtitle',
    'step1',
    'step2',
    'step3',
    'searchPlaceholder',
    'searchLabel',
    'datePlaceholder',
    'dateLabel',
    'amountPlaceholder',
    'amountLabel',
    'calculate',
    'calculateRegret',
    'instructions',
    'summary',
    'summaryText',
  ] as const satisfies readonly (keyof HomeMessages)[],

  result: [
    'title',
    'headline',
    'purchasePrice',
    'currentPrice',
    'change',
    'absoluteGainLoss',
    'asOf',
    'buyDate',
    'percentChange',
    'absoluteChange',
    'return',
    'pnlSummary',
    'pnlDetails',
    'stockResult',
  ] as const satisfies readonly (keyof ResultMessages)[],

  outcome: [
    'jackpot',
    'gain',
    'flat',
    'loss',
    'catastrophe',
  ] as const satisfies readonly (keyof OutcomeMessages)[],

  share: [
    'download',
    'downloadImage',
    'copy',
    'copyToClipboard',
    'share',
    'copied',
    'downloading',
    'generating',
    'downloaded',
    'done',
    'copyFailed',
    'unsupported',
    'copying',
    'selectSize',
    'shareTitle',
    'shareText',
    'retry',
  ] as const satisfies readonly (keyof ShareMessages)[],

  size: [
    'instagram',
    'twitterOg',
    'portrait',
    'landscape',
  ] as const satisfies readonly (keyof SizeMessages)[],

  meme: [
    'jackpot',
    'gain',
    'flat',
    'loss',
    'catastrophe',
  ] as const satisfies readonly MemeOutcomeTiers[],

  memeContent: [
    'headline',
    'subline',
  ] as const satisfies readonly (keyof MemeContent)[],

  search: [
    'searching',
    'noResults',
    'resultsFound',
    'noResultsFound',
    'tryAgain',
    'clearSearch',
  ] as const satisfies readonly (keyof SearchMessages)[],

  date: [
    'selectPurchaseDate',
    'quickSelect',
    'weekendWarning',
    'invalidFormat',
    'futureDate',
    'selectPastDate',
    'tooOld',
    'weekendHint',
    'preset',
  ] as const satisfies readonly (keyof DateMessages)[],

  datePresets: [
    '1week',
    '1month',
    '3months',
    '6months',
    '1year',
    '2years',
    '5years',
  ] as const satisfies readonly (keyof DatePresets)[],

  error: [
    'fetchFailed',
    'invalidTicker',
    'noData',
    'retry',
    'networkError',
    'serverError',
    'unknownError',
  ] as const satisfies readonly (keyof ErrorMessages)[],

  chart: [
    'loading',
    'buyMarker',
  ] as const satisfies readonly (keyof ChartMessages)[],

  accessibility: [
    'loadingChart',
    'loadingResult',
    'searchResults',
    'datePresets',
  ] as const satisfies readonly (keyof AccessibilityMessages)[],

  footer: [
    'disclaimer',
    'brand',
    'tagline',
  ] as const satisfies readonly (keyof FooterMessages)[],
} as const;

// Export types for use in other modules
export type {
  Messages,
  TopLevelKeys,
  CommonMessages,
  HomeMessages,
  ResultMessages,
  OutcomeMessages,
  ShareMessages,
  SizeMessages,
  MemeMessages,
  MemeOutcomeTiers,
  MemeContent,
  SearchMessages,
  DateMessages,
  DatePresets,
  ErrorMessages,
  ChartMessages,
  AccessibilityMessages,
  FooterMessages,
};
