import { useState, useRef, useEffect, useId } from 'react';
import type { ApiClient } from '../../api/types';

export interface SlugAvailabilityInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidSlug: (slug: string) => void;
  apiClient: ApiClient;
  label?: string;
}

type SlugStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error';

function validateFormat(slug: string): string | null {
  if (slug.length < 3) return 'Must be at least 3 characters';
  if (slug.length > 30) return 'Must be 30 characters or fewer';
  if (!/^[a-z0-9-]+$/.test(slug)) return 'Only lowercase letters, numbers, and hyphens';
  if (slug.startsWith('-') || slug.endsWith('-')) return 'Cannot start or end with a hyphen';
  return null;
}

export function SlugAvailabilityInput({
  value,
  onChange,
  onValidSlug,
  apiClient,
  label = 'Club URL slug',
}: SlugAvailabilityInputProps) {
  const uid = useId();
  const inputId = `slug-input-${uid}`;
  const statusId = `slug-status-${uid}`;

  const [status, setStatus] = useState<SlugStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Stable ref so the effect doesn't re-run when parent re-renders with inline callbacks
  const onValidSlugRef = useRef(onValidSlug);
  onValidSlugRef.current = onValidSlug;

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;

    if (!value) {
      setStatus('idle');
      setStatusMessage('');
      return;
    }

    const formatError = validateFormat(value);
    if (formatError) {
      setStatus('invalid');
      setStatusMessage(formatError);
      return;
    }

    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus('checking');
      setStatusMessage('');

      apiClient
        .checkSlugAvailability(value, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          if (result.available) {
            setStatus('available');
            setStatusMessage('Available');
            onValidSlugRef.current(value);
          } else {
            setStatus('taken');
            setStatusMessage('Already taken');
          }
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === 'AbortError') return;
          setStatus('error');
          setStatusMessage('Could not check availability — try again');
        });
    }, 400);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      abortRef.current?.abort();
    };
  }, [value, apiClient]);

  const isInvalid = status === 'taken' || status === 'invalid' || status === 'error';

  return (
    <div className="slug-availability-input" data-testid="slug-availability-input">
      <label htmlFor={inputId} className="slug-availability-label">
        {label}
      </label>
      <div className="slug-availability-field">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          aria-invalid={isInvalid}
          aria-describedby={statusId}
          className="slug-availability-input-field"
          data-testid="slug-input"
          placeholder="your-club"
          autoComplete="off"
          spellCheck={false}
          maxLength={30}
        />
        {status === 'checking' && (
          <span
            className="slug-status-icon slug-status-icon--checking"
            data-testid="slug-status-checking"
            aria-hidden="true"
          >
            ⟳
          </span>
        )}
        {status === 'available' && (
          <span
            className="slug-status-icon slug-status-icon--available"
            data-testid="slug-status-available"
            aria-hidden="true"
          >
            ✓
          </span>
        )}
        {(status === 'taken' || status === 'error') && (
          <span
            className="slug-status-icon slug-status-icon--taken"
            data-testid="slug-status-taken"
            aria-hidden="true"
          >
            ✗
          </span>
        )}
      </div>
      <span
        id={statusId}
        role="status"
        aria-live="polite"
        className={`slug-status-message slug-status-message--${status}`}
        data-testid="slug-status-message"
      >
        {statusMessage}
      </span>
    </div>
  );
}
