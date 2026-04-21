import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdatedAt: Date | null;
  consecutiveFailures: number;
}

interface UseApiOptions {
  pollingInterval?: number;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options?: UseApiOptions,
): UseApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
    lastUpdatedAt: null,
    consecutiveFailures: 0,
  });

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: s.data === null, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null, lastUpdatedAt: new Date(), consecutiveFailures: 0 });
    } catch (err) {
      setState((s) => ({
        data: s.data,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        lastUpdatedAt: s.lastUpdatedAt,
        consecutiveFailures: s.consecutiveFailures + 1,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!options?.pollingInterval) return;

    const id = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        fetch();
      }
    }, options.pollingInterval);

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') {
        fetch();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetch, options?.pollingInterval]);

  return { ...state, refetch: fetch };
}
