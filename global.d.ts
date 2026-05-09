/**
 * Type-safe i18n declarations for next-intl
 *
 * This file enables TypeScript to catch missing translation keys at build time.
 * The Korean messages file (ko.json) is used as the source of truth for the type.
 *
 * When a translation key is used that doesn't exist in messages/ko.json,
 * TypeScript will produce a compile error.
 */

import type ko from './messages/ko.json';

type Messages = typeof ko;

declare global {
  // Use type safe message keys with `auto-complete` support
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IntlMessages extends Messages {}
}
