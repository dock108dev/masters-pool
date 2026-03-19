import type { ApiClient } from './types';
import { MockApiClient } from './mock/adapters';

// TODO: Replace MockApiClient with real HttpApiClient once backend is available
// To swap: implement ApiClient interface with fetch calls to real endpoints
// import { HttpApiClient } from './http-client';
// export const apiClient: ApiClient = new HttpApiClient(API_BASE_URL);

export const apiClient: ApiClient = new MockApiClient(300);
