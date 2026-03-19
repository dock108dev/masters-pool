import type { ApiClient } from './types';
import { MockApiClient } from './mock/adapters';

// TODO: Replace with HttpApiClient implementing ApiClient with fetch calls to real endpoints.
// Swap point: change this single line to connect to the real backend.
export const apiClient: ApiClient = new MockApiClient(300);
