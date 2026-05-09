/**
 * Debounce Hook
 *
 * Provides a debounced value that updates after a specified delay.
 * Useful for search inputs to prevent excessive API calls.
 */

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook that returns a debounced version of the provided value.
 * The debounced value only updates after the specified delay has passed
 * since the last change to the input value.
 *
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // This effect only runs 300ms after the user stops typing
 *   fetchSearchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timer if value changes before delay completes
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that returns a debounced callback function.
 * The callback will only execute after the specified delay has passed
 * since the last invocation.
 *
 * @param callback - The function to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns A debounced version of the callback
 *
 * @example
 * ```tsx
 * const debouncedFetch = useDebouncedCallback(
 *   (query: string) => fetchResults(query),
 *   300
 * );
 *
 * <input onChange={(e) => debouncedFetch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return debouncedCallback;
}

/**
 * Hook that provides both immediate and debounced values,
 * useful for showing immediate UI feedback while debouncing API calls.
 *
 * @param initialValue - The initial value
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns Object with value, debouncedValue, setValue, and isPending
 *
 * @example
 * ```tsx
 * const { value, debouncedValue, setValue, isPending } = useDebouncedState("");
 *
 * return (
 *   <>
 *     <input value={value} onChange={(e) => setValue(e.target.value)} />
 *     {isPending && <Spinner />}
 *   </>
 * );
 * ```
 */
export function useDebouncedState<T>(initialValue: T, delay: number = 300) {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  // Track if there's a pending debounce
  const isPending = value !== debouncedValue;

  return {
    value,
    debouncedValue,
    setValue,
    isPending,
  };
}
