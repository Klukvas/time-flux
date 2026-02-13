import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateFromRecommendationRequest } from '@lifespan/api';
import { QUERY_KEYS, STALE_TIMES } from '@lifespan/constants';
import { useApi } from './api-context';

export function useRecommendations() {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.recommendations,
    queryFn: () => api.recommendations.list(),
    staleTime: STALE_TIMES.recommendations,
  });
}

export function useCreateCategoryFromRecommendation() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFromRecommendationRequest) =>
      api.categories.createFromRecommendation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

export function useCreateDayStateFromRecommendation() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFromRecommendationRequest) =>
      api.dayStates.createFromRecommendation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dayStates });
    },
  });
}
