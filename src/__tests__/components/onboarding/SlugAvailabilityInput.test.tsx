import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SlugAvailabilityInput } from '../../../components/onboarding/SlugAvailabilityInput';
import { MockApiClient } from '../../../api/mock/adapters';
import type { ApiClient } from '../../../api/types';

function renderInput(props: Partial<{
  value: string;
  onChange: (v: string) => void;
  onValidSlug: (slug: string) => void;
  apiClient: ApiClient;
}> = {}) {
  const defaults = {
    value: '',
    onChange: vi.fn(),
    onValidSlug: vi.fn(),
    apiClient: new MockApiClient(0),
  };
  const merged = { ...defaults, ...props };
  return render(<SlugAvailabilityInput {...merged} />);
}

describe('SlugAvailabilityInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Idle state ─────────────────────────────────────────────────────────────

  it('renders in idle state with empty value', () => {
    renderInput({ value: '' });
    expect(screen.getByTestId('slug-status-message')).toHaveTextContent('');
    expect(screen.queryByTestId('slug-status-checking')).not.toBeInTheDocument();
    expect(screen.queryByTestId('slug-status-available')).not.toBeInTheDocument();
    expect(screen.queryByTestId('slug-status-taken')).not.toBeInTheDocument();
    expect(screen.getByTestId('slug-input')).not.toHaveAttribute('aria-invalid', 'true');
  });

  // ── Format validation (no API call) ────────────────────────────────────────

  it('shows error for slug that is too short without making an API call', () => {
    const client = new MockApiClient(0);
    const spy = vi.spyOn(client, 'checkSlugAvailability');
    renderInput({ value: 'ab', apiClient: client });
    expect(screen.getByTestId('slug-status-message')).toHaveTextContent('Must be at least 3 characters');
    expect(screen.getByTestId('slug-input')).toHaveAttribute('aria-invalid', 'true');
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows error for slug exceeding 30 characters without API call', () => {
    const client = new MockApiClient(0);
    const spy = vi.spyOn(client, 'checkSlugAvailability');
    renderInput({ value: 'a'.repeat(31), apiClient: client });
    expect(screen.getByTestId('slug-status-message')).toHaveTextContent('Must be 30 characters or fewer');
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows error for slug starting with a hyphen without API call', () => {
    const client = new MockApiClient(0);
    const spy = vi.spyOn(client, 'checkSlugAvailability');
    renderInput({ value: '-my-club', apiClient: client });
    expect(screen.getByTestId('slug-status-message')).toHaveTextContent('Cannot start or end with a hyphen');
    expect(spy).not.toHaveBeenCalled();
  });

  // ── Checking state ─────────────────────────────────────────────────────────

  it('shows checking spinner while the API call is in-flight', async () => {
    const neverResolveClient: ApiClient = {
      ...new MockApiClient(0),
      checkSlugAvailability: vi.fn().mockReturnValue(new Promise(() => {})),
    };
    renderInput({ value: 'my-club', apiClient: neverResolveClient });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByTestId('slug-status-checking')).toBeInTheDocument();
    expect(screen.queryByTestId('slug-status-available')).not.toBeInTheDocument();
    expect(screen.queryByTestId('slug-status-taken')).not.toBeInTheDocument();
  });

  // ── Available state ────────────────────────────────────────────────────────

  it('shows available state for an unclaimed slug', async () => {
    const client = new MockApiClient(0);
    renderInput({ value: 'my-club', apiClient: client });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId('slug-status-available')).toBeInTheDocument();
    expect(screen.getByTestId('slug-status-message')).toHaveTextContent('Available');
    expect(screen.queryByTestId('slug-status-taken')).not.toBeInTheDocument();
  });

  it('marks input as not aria-invalid when slug is available', async () => {
    renderInput({ value: 'my-club' });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId('slug-input')).not.toHaveAttribute('aria-invalid', 'true');
  });

  // ── Taken state ────────────────────────────────────────────────────────────

  it('shows taken state for an already-claimed slug', async () => {
    const client = new MockApiClient(0, [], [], null, false, false, ['my-club']);
    renderInput({ value: 'my-club', apiClient: client });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId('slug-status-taken')).toBeInTheDocument();
    expect(screen.getByTestId('slug-status-message')).toHaveTextContent('Already taken');
    expect(screen.queryByTestId('slug-status-available')).not.toBeInTheDocument();
  });

  it('marks input as aria-invalid when slug is taken', async () => {
    const client = new MockApiClient(0, [], [], null, false, false, ['my-club']);
    renderInput({ value: 'my-club', apiClient: client });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId('slug-input')).toHaveAttribute('aria-invalid', 'true');
  });

  // ── onValidSlug callback ───────────────────────────────────────────────────

  it('calls onValidSlug when slug becomes available', async () => {
    const onValidSlug = vi.fn();
    renderInput({ value: 'my-club', onValidSlug });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onValidSlug).toHaveBeenCalledOnce();
    expect(onValidSlug).toHaveBeenCalledWith('my-club');
  });

  it('does not call onValidSlug when slug is taken', async () => {
    const onValidSlug = vi.fn();
    const client = new MockApiClient(0, [], [], null, false, false, ['taken-slug']);
    renderInput({ value: 'taken-slug', apiClient: client, onValidSlug });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onValidSlug).not.toHaveBeenCalled();
  });

  it('does not call onValidSlug for invalid format', () => {
    const onValidSlug = vi.fn();
    renderInput({ value: 'ab', onValidSlug });
    expect(onValidSlug).not.toHaveBeenCalled();
  });

  // ── Debouncing ─────────────────────────────────────────────────────────────

  it('makes at most one API call when value is updated rapidly', async () => {
    const client = new MockApiClient(0);
    const spy = vi.spyOn(client, 'checkSlugAvailability');

    const { rerender } = renderInput({ value: 'p', apiClient: client });

    // Simulate rapid typing — each rerender is a prop change before debounce fires
    rerender(
      <SlugAvailabilityInput
        value="pi"
        onChange={vi.fn()}
        onValidSlug={vi.fn()}
        apiClient={client}
      />
    );
    rerender(
      <SlugAvailabilityInput
        value="pin"
        onChange={vi.fn()}
        onValidSlug={vi.fn()}
        apiClient={client}
      />
    );
    rerender(
      <SlugAvailabilityInput
        value="pine"
        onChange={vi.fn()}
        onValidSlug={vi.fn()}
        apiClient={client}
      />
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Only the final debounced value should trigger an API call
    expect(spy).toHaveBeenCalledOnce();
    const [calledSlug, calledSignal] = spy.mock.calls[0];
    expect(calledSlug).toBe('pine');
    expect(calledSignal).toBeInstanceOf(AbortSignal);
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('has aria-describedby on the input pointing to the status element', () => {
    renderInput({ value: '' });
    const input = screen.getByTestId('slug-input');
    const describedById = input.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    expect(document.getElementById(describedById!)).toBeInTheDocument();
  });

  it('status message element has role="status" and aria-live="polite"', () => {
    renderInput({ value: '' });
    const msg = screen.getByTestId('slug-status-message');
    expect(msg).toHaveAttribute('role', 'status');
    expect(msg).toHaveAttribute('aria-live', 'polite');
  });
});
