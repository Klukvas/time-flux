import type { AxiosInstance } from 'axios';
import type {
  SubscriptionResponse,
  CancelSubscriptionResponse,
  ChangePlanRequest,
  ChangePlanResponse,
  PlanPrice,
} from '../types';

export function createSubscriptionsApi(client: AxiosInstance) {
  return {
    get: () =>
      client
        .get<SubscriptionResponse>('/api/v1/subscriptions')
        .then((r) => r.data),

    prices: () =>
      client
        .get<PlanPrice[]>('/api/v1/subscriptions/prices')
        .then((r) => r.data),

    cancel: () =>
      client
        .post<CancelSubscriptionResponse>('/api/v1/subscriptions/cancel')
        .then((r) => r.data),

    changePlan: (data: ChangePlanRequest) =>
      client
        .post<ChangePlanResponse>('/api/v1/subscriptions/change-plan', data)
        .then((r) => r.data),

    reactivate: () =>
      client
        .post<{ message: string }>('/api/v1/subscriptions/reactivate')
        .then((r) => r.data),
  };
}
