import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, STALE_TIMES } from '@lifespan/constants';
import { useApi } from './api-context';

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
