import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useApi } from '../../hooks/useApi';

describe('useApi polling', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls fetcher on mount', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    renderHook(() => useApi(fetcher, []));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  });

  it('calls fetch at the specified interval when tab is visible', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    renderHook(() => useApi(fetcher, [], { pollingInterval: 1000 }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    await act(async () => { vi.advanceTimersByTime(1000); });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    await act(async () => { vi.advanceTimersByTime(1000); });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3));
  });

  it('pauses polling when tab is hidden', async () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });

    const fetcher = vi.fn().mockResolvedValue('data');
    renderHook(() => useApi(fetcher, [], { pollingInterval: 1000 }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1)); // initial fetch always fires

    await act(async () => { vi.advanceTimersByTime(3000); });
    // interval fired 3× but skipped each time because tab is hidden
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('resumes fetching when tab becomes visible again', async () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });

    const fetcher = vi.fn().mockResolvedValue('data');
    renderHook(() => useApi(fetcher, [], { pollingInterval: 1000 }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(fetcher).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });

  it('tracks lastUpdatedAt after successful fetch', async () => {
    const now = new Date('2026-04-10T14:00:00Z');
    vi.setSystemTime(now);
    const fetcher = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useApi(fetcher, []));
    await waitFor(() => expect(result.current.lastUpdatedAt).not.toBeNull());
    expect(result.current.lastUpdatedAt?.getTime()).toBe(now.getTime());
  });

  it('increments consecutiveFailures on each failed fetch', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useApi(fetcher, [], { pollingInterval: 1000 }));
    await waitFor(() => expect(result.current.consecutiveFailures).toBe(1));

    await act(async () => { vi.advanceTimersByTime(1000); });
    await waitFor(() => expect(result.current.consecutiveFailures).toBe(2));
  });

  it('resets consecutiveFailures after a successful fetch', async () => {
    let shouldFail = true;
    const fetcher = vi.fn().mockImplementation(() =>
      shouldFail ? Promise.reject(new Error('err')) : Promise.resolve('ok'),
    );
    const { result } = renderHook(() => useApi(fetcher, [], { pollingInterval: 1000 }));
    await waitFor(() => expect(result.current.consecutiveFailures).toBe(1));

    shouldFail = false;
    await act(async () => { vi.advanceTimersByTime(1000); });
    await waitFor(() => expect(result.current.consecutiveFailures).toBe(0));
  });

  it('does not set loading to true on background polls when data exists', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useApi(fetcher, [], { pollingInterval: 1000 }));
    await waitFor(() => expect(result.current.data).toBe('data'));
    expect(result.current.loading).toBe(false);

    await act(async () => { vi.advanceTimersByTime(1000); });
    // should stay false — data !== null so loading stays false during re-fetch
    expect(result.current.loading).toBe(false);
  });
});
