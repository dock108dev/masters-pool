import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;

// Initialize only when the key is present and we are not running under Vitest.
if (key && import.meta.env.MODE !== 'test') {
  posthog.init(key, {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: false,
    persistence: 'memory',
  });
}

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (!key || import.meta.env.MODE === 'test') return;
  posthog.capture(event, properties);
}
