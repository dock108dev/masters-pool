import { useUser, useOrganization } from '@clerk/clerk-react';

export interface CoordinatorAuth {
  user: ReturnType<typeof useUser>['user'];
  orgId: string | null;
  orgSlug: string | null;
  isLoaded: boolean;
}

export function useCoordinatorAuth(): CoordinatorAuth {
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();

  return {
    user: user ?? null,
    orgId: organization?.id ?? null,
    orgSlug: organization?.slug ?? null,
    isLoaded: userLoaded && orgLoaded,
  };
}
