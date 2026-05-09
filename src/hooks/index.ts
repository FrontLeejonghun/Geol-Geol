/**
 * Hooks Index
 *
 * Central export point for all custom React hooks.
 */

export { useDebounce, useDebouncedCallback, useDebouncedState } from "./use-debounce";
export {
  useShareImage,
  type UseShareImageOptions,
  type UseShareImageState,
  type UseShareImageActions,
  type UseShareImageReturn,
} from "./use-share-image";
export {
  useKeyboardNavigation,
  useFocusTrap,
  useRovingTabIndex,
  useFormKeyboardNavigation,
  getFocusableElements,
  focusFirst,
  focusNextElement,
  type UseKeyboardNavigationOptions,
  type UseFocusTrapOptions,
  type UseRovingTabIndexOptions,
  type UseFormKeyboardNavigationOptions,
} from "./use-keyboard-navigation";
