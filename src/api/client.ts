import type { ApiClient } from './types';
import { HttpApiClient } from './http';

export const apiClient: ApiClient = new HttpApiClient();
