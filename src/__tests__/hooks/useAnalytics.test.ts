import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAnalytics } from '../../hooks/useAnalytics';

// posthog-js must not be called in test mode
vi.mock('../../analytics/posthog', () => ({
  captureEvent: vi.fn(),
}));

import { captureEvent } from '../../analytics/posthog';

describe('useAnalytics', () => {
  it('returns an object with a capture function', () => {
    const { result } = renderHook(() => useAnalytics());
    expect(typeof result.current.capture).toBe('function');
  });

  it('delegates to captureEvent with the given event name and properties', () => {
    const { result } = renderHook(() => useAnalytics());
    result.current.capture('test_event', { foo: 'bar' });
    expect(captureEvent).toHaveBeenCalledWith('test_event', { foo: 'bar' });
  });

  it('capture does not throw when called with no properties', () => {
    const { result } = renderHook(() => useAnalytics());
    expect(() => result.current.capture('page_view')).not.toThrow();
  });

  it('returns a stable capture reference across renders', () => {
    const { result, rerender } = renderHook(() => useAnalytics());
    const first = result.current.capture;
    rerender();
    expect(result.current.capture).toBe(first);
  });
});
