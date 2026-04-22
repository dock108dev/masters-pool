import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCoordinatorAuth } from '../../hooks/useCoordinatorAuth';

vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(),
  useOrganization: vi.fn(),
}));

import { useUser, useOrganization } from '@clerk/clerk-react';
const mockUseUser = vi.mocked(useUser);
const mockUseOrganization = vi.mocked(useOrganization);

describe('useCoordinatorAuth', () => {
  it('returns isLoaded: false while either hook is loading', () => {
    mockUseUser.mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
      user: undefined,
    });
    mockUseOrganization.mockReturnValue({
      isLoaded: true,
      organization: null,
      membership: null,
      domains: undefined as never,
      membershipRequests: undefined as never,
      memberships: undefined as never,
      invitations: undefined as never,
    });

    const { result } = renderHook(() => useCoordinatorAuth());
    expect(result.current.isLoaded).toBe(false);
  });

  it('returns isLoaded: true when both hooks have loaded', () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: { id: 'user_123', primaryEmailAddress: null } as never,
    });
    mockUseOrganization.mockReturnValue({
      isLoaded: true,
      organization: { id: 'org_xyz', slug: 'rvcc' } as never,
      membership: null,
      domains: undefined as never,
      membershipRequests: undefined as never,
      memberships: undefined as never,
      invitations: undefined as never,
    });

    const { result } = renderHook(() => useCoordinatorAuth());
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.user).toMatchObject({ id: 'user_123' });
    expect(result.current.orgId).toBe('org_xyz');
    expect(result.current.orgSlug).toBe('rvcc');
  });

  it('returns null orgId and orgSlug when no active org', () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: { id: 'user_123' } as never,
    });
    mockUseOrganization.mockReturnValue({
      isLoaded: true,
      organization: null,
      membership: null,
      domains: undefined as never,
      membershipRequests: undefined as never,
      memberships: undefined as never,
      invitations: undefined as never,
    });

    const { result } = renderHook(() => useCoordinatorAuth());
    expect(result.current.orgId).toBeNull();
    expect(result.current.orgSlug).toBeNull();
  });

  it('returns null user when signed out', () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    });
    mockUseOrganization.mockReturnValue({
      isLoaded: true,
      organization: null,
      membership: null,
      domains: undefined as never,
      membershipRequests: undefined as never,
      memberships: undefined as never,
      invitations: undefined as never,
    });

    const { result } = renderHook(() => useCoordinatorAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isLoaded).toBe(true);
  });
});
