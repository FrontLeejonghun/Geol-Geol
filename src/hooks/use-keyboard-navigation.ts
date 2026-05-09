/**
 * Keyboard Navigation Hook
 *
 * Provides reusable keyboard navigation utilities for forms and components.
 * Features:
 * - Focus management within containers
 * - Roving tabindex for lists/groups
 * - Enter/Escape key handlers
 * - Tab trap for modals
 */

import { useCallback, useEffect, useRef, type RefObject, type KeyboardEvent } from "react";

// =============================================================================
// Types
// =============================================================================

export interface UseKeyboardNavigationOptions {
  /** Enable/disable keyboard handling */
  enabled?: boolean;
  /** Called when Enter is pressed */
  onEnter?: () => void;
  /** Called when Escape is pressed */
  onEscape?: () => void;
  /** Prevent default on Enter key */
  preventEnterDefault?: boolean;
  /** Prevent default on Escape key */
  preventEscapeDefault?: boolean;
}

export interface UseFocusTrapOptions {
  /** Enable/disable focus trap */
  enabled?: boolean;
  /** Return focus to this element when trap is disabled */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** Initial element to focus when trap is enabled */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export interface UseRovingTabIndexOptions<T extends HTMLElement> {
  /** Array of item refs */
  items: RefObject<T | null>[];
  /** Orientation for arrow key navigation */
  orientation?: "horizontal" | "vertical" | "both";
  /** Loop navigation at boundaries */
  loop?: boolean;
  /** Called when an item is activated (Enter/Space) */
  onActivate?: (index: number) => void;
}

// =============================================================================
// Focus Utilities
// =============================================================================

const FOCUSABLE_ELEMENTS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
  return Array.from(elements).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
  );
}

/**
 * Focus the first focusable element in a container
 */
export function focusFirst(container: HTMLElement): HTMLElement | null {
  const elements = getFocusableElements(container);
  if (elements.length > 0 && elements[0]) {
    elements[0].focus();
    return elements[0];
  }
  return null;
}

/**
 * Focus the next/previous focusable element
 */
export function focusNextElement(
  currentElement: HTMLElement,
  direction: "forward" | "backward" = "forward",
  loop = true
): HTMLElement | null {
  const container = currentElement.closest("form") || document.body;
  const elements = getFocusableElements(container as HTMLElement);
  const currentIndex = elements.indexOf(currentElement);

  if (currentIndex === -1) return null;

  let nextIndex: number;
  if (direction === "forward") {
    nextIndex = currentIndex + 1;
    if (nextIndex >= elements.length) {
      nextIndex = loop ? 0 : elements.length - 1;
    }
  } else {
    nextIndex = currentIndex - 1;
    if (nextIndex < 0) {
      nextIndex = loop ? elements.length - 1 : 0;
    }
  }

  const nextElement = elements[nextIndex];
  if (nextElement) {
    nextElement.focus();
    return nextElement;
  }
  return null;
}

// =============================================================================
// useKeyboardNavigation Hook
// =============================================================================

/**
 * Hook for handling keyboard navigation with Enter/Escape keys
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const {
    enabled = true,
    onEnter,
    onEscape,
    preventEnterDefault = false,
    preventEscapeDefault = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (!enabled) return;

      switch (event.key) {
        case "Enter":
          if (onEnter) {
            if (preventEnterDefault) {
              event.preventDefault();
            }
            onEnter();
          }
          break;

        case "Escape":
          if (onEscape) {
            if (preventEscapeDefault) {
              event.preventDefault();
            }
            onEscape();
          }
          break;
      }
    },
    [enabled, onEnter, onEscape, preventEnterDefault, preventEscapeDefault]
  );

  return { handleKeyDown };
}

// =============================================================================
// useFocusTrap Hook
// =============================================================================

/**
 * Hook for trapping focus within a container
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  options: UseFocusTrapOptions = {}
) {
  const { enabled = true, returnFocusRef, initialFocusRef } = options;
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Save current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus initial element or first focusable
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else {
      focusFirst(containerRef.current);
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Tab" || !containerRef.current) return;

      const elements = getFocusableElements(containerRef.current);
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (event.shiftKey) {
        // Shift+Tab from first element -> go to last
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab from last element -> go to first
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      // Return focus when trap is disabled
      if (returnFocusRef?.current) {
        returnFocusRef.current.focus();
      } else if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [enabled, containerRef, initialFocusRef, returnFocusRef]);
}

// =============================================================================
// useRovingTabIndex Hook
// =============================================================================

/**
 * Hook for roving tabindex pattern (arrow key navigation in groups)
 */
export function useRovingTabIndex<T extends HTMLElement>(
  options: UseRovingTabIndexOptions<T>
) {
  const { items, orientation = "both", loop = true, onActivate } = options;
  const currentIndexRef = useRef(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const validItems = items.filter((ref) => ref.current !== null);
      if (validItems.length === 0) return;

      const currentIndex = currentIndexRef.current;
      let nextIndex = currentIndex;
      let handled = false;

      switch (event.key) {
        case "ArrowRight":
          if (orientation === "horizontal" || orientation === "both") {
            nextIndex = loop
              ? (currentIndex + 1) % validItems.length
              : Math.min(currentIndex + 1, validItems.length - 1);
            handled = true;
          }
          break;

        case "ArrowLeft":
          if (orientation === "horizontal" || orientation === "both") {
            nextIndex = loop
              ? (currentIndex - 1 + validItems.length) % validItems.length
              : Math.max(currentIndex - 1, 0);
            handled = true;
          }
          break;

        case "ArrowDown":
          if (orientation === "vertical" || orientation === "both") {
            nextIndex = loop
              ? (currentIndex + 1) % validItems.length
              : Math.min(currentIndex + 1, validItems.length - 1);
            handled = true;
          }
          break;

        case "ArrowUp":
          if (orientation === "vertical" || orientation === "both") {
            nextIndex = loop
              ? (currentIndex - 1 + validItems.length) % validItems.length
              : Math.max(currentIndex - 1, 0);
            handled = true;
          }
          break;

        case "Home":
          nextIndex = 0;
          handled = true;
          break;

        case "End":
          nextIndex = validItems.length - 1;
          handled = true;
          break;

        case "Enter":
        case " ":
          event.preventDefault();
          onActivate?.(currentIndex);
          return;
      }

      if (handled) {
        event.preventDefault();
        currentIndexRef.current = nextIndex;
        const nextItem = validItems[nextIndex]?.current;
        if (nextItem) {
          nextItem.focus();
        }
      }
    },
    [items, orientation, loop, onActivate]
  );

  const setActiveIndex = useCallback((index: number) => {
    currentIndexRef.current = index;
  }, []);

  const getTabIndex = useCallback(
    (index: number) => (index === currentIndexRef.current ? 0 : -1),
    []
  );

  return { handleKeyDown, setActiveIndex, getTabIndex };
}

// =============================================================================
// useFormKeyboardNavigation Hook
// =============================================================================

export interface UseFormKeyboardNavigationOptions {
  /** Called when form should be submitted */
  onSubmit: () => void;
  /** Called when form should be cleared/reset */
  onClear?: () => void;
  /** Element to focus after clear */
  clearFocusRef?: RefObject<HTMLElement | null>;
  /** Whether form is valid for submission */
  isValid?: boolean;
}

/**
 * Hook for form-level keyboard navigation
 * - Enter on last field submits form (if valid)
 * - Escape clears form and returns focus to first field
 */
export function useFormKeyboardNavigation(
  formRef: RefObject<HTMLFormElement | null>,
  options: UseFormKeyboardNavigationOptions
) {
  const { onSubmit, onClear, clearFocusRef, isValid = true } = options;

  const handleFormKeyDown = useCallback(
    (event: KeyboardEvent<HTMLFormElement>) => {
      // Escape: Clear form
      if (event.key === "Escape") {
        event.preventDefault();
        onClear?.();

        // Focus the clear target or first focusable
        if (clearFocusRef?.current) {
          clearFocusRef.current.focus();
        } else if (formRef.current) {
          focusFirst(formRef.current);
        }
        return;
      }

      // Enter: Submit if valid and on a text input (not button)
      if (event.key === "Enter" && isValid) {
        const target = event.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        const inputType = (target as HTMLInputElement).type;

        // Don't interfere with buttons or textareas
        if (tagName === "button" || tagName === "textarea") {
          return;
        }

        // For text inputs, submit the form
        if (tagName === "input" && inputType !== "submit" && inputType !== "button") {
          // Check if this is in an autocomplete with dropdown open
          const combobox = target.getAttribute("role") === "combobox";
          const expanded = target.getAttribute("aria-expanded") === "true";

          // Don't submit if dropdown is open (let component handle it)
          if (combobox && expanded) {
            return;
          }

          event.preventDefault();
          onSubmit();
        }
      }
    },
    [onSubmit, onClear, clearFocusRef, formRef, isValid]
  );

  return { handleFormKeyDown };
}

