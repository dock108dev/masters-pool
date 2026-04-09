import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  pollingInterval?: number;
}

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = [], options?: UseApiOptions): UseApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: s.data === null, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState((s) => ({ data: s.data, loading: false, error: err instanceof Error ? err.message : 'Unknown error' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!options?.pollingInterval) return;
    const id = setInterval(fetch, options.pollingInterval);
    return () => clearInterval(id);
  }, [fetch, options?.pollingInterval]);

  return { ...state, refetch: fetch };
}
