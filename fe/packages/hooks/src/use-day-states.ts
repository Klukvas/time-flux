import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateDayStateRequest, UpdateDayStateRequest } from '@lifespan/api';
import { QUERY_KEYS, STALE_TIMES } from '@lifespan/constants';
import { useApi } from './api-context';

export function useDayStates() {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.dayStates,
    queryFn: () => api.dayStates.list(),
    staleTime: STALE_TIMES.dayStates,
  });
}

export function useCreateDayState() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDayStateRequest) => api.dayStates.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.dayStates }),
  });
}

export function useUpdateDayState() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDayStateRequest }) =>
      api.dayStates.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dayStates });
      qc.invalidateQueries({ queryKey: ['timeline'] });
      qc.invalidateQueries({ queryKey: ['days'] });
    },
  });
}

export function useDeleteDayState() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.dayStates.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.dayStates }),
  });
}
