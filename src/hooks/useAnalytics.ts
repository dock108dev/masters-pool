import { useCallback } from 'react';
import { captureEvent } from '../analytics/posthog';

export function useAnalytics(): { capture: (event: string, properties?: Record<string, unknown>) => void } {
  const capture = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      captureEvent(event, properties);
    },
    [],
  );
  return { capture };
}
