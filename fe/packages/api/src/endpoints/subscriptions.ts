import type { AxiosInstance } from 'axios';
import type { SubscriptionResponse, CancelSubscriptionResponse } from '../types';

export function createSubscriptionsApi(client: AxiosInstance) {
  return {
    get: () =>
      client.get<SubscriptionResponse>('/api/v1/subscriptions').then((r) => r.data),

    cancel: () =>
      client.post<CancelSubscriptionResponse>('/api/v1/subscriptions/cancel').then((r) => r.data),
  };
}
