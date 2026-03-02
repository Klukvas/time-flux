import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DayQueryParams,
  UpdateDayLocationRequest,
  UpsertDayRequest,
} from '@timeflux/api';
import { QUERY_KEYS, STALE_TIMES } from '@timeflux/constants';
import { useApi } from './api-context';

export function useDays(params: DayQueryParams) {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.days(params),
    queryFn: () => api.days.list(params),
    staleTime: STALE_TIMES.days,
  });
}

export function useUpsertDay() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, data }: { date: string; data: UpsertDayRequest }) =>
      api.days.upsert(date, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['days'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
      qc.invalidateQueries({ queryKey: ['memories'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.moodOverview });
    },
  });
}

export function useUpdateDayLocation() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      date,
      data,
    }: {
      date: string;
      data: UpdateDayLocationRequest;
    }) => api.days.updateLocation(date, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['days'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
      qc.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
