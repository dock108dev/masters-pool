import { useState } from 'react';

export function usePersistedState<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  function set(value: T | ((prev: T) => T)) {
    setState((prev) => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage full or disabled
      }
      return next;
    });
  }

  function clear() {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  return [state, set, clear];
}
