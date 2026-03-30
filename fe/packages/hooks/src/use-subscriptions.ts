import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChangePlanRequest } from '@timeflux/api';
import { QUERY_KEYS, STALE_TIMES } from '@timeflux/constants';
import { useApi } from './api-context';

export function usePlanPrices() {
  const api = useApi();
  return useQuery({
    queryKey: [...QUERY_KEYS.subscription, 'prices'],
    queryFn: () => api.subscriptions.prices(),
    staleTime: 3_600_000, // 1 hour — prices rarely change
  });
}

export function useSubscription() {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.subscription,
    queryFn: () => api.subscriptions.get(),
    staleTime: STALE_TIMES.subscription,
  });
}

export function useCancelSubscription() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.subscriptions.cancel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscription });
    },
  });
}

export function useReactivateSubscription() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.subscriptions.reactivate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscription });
    },
  });
}

export function useChangePlan() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChangePlanRequest) => api.subscriptions.changePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscription });
    },
  });
}
