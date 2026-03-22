import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateDayMediaRequest,
  UpdateDayMediaRequest,
} from '@timeflux/api';
import { QUERY_KEYS } from '@timeflux/constants';
import { useApi } from './api-context';

export function useDayMedia(date: string) {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.dayMedia(date),
    queryFn: () => api.media.listForDay(date),
    enabled: !!date,
  });
}

export function useCreateDayMedia() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      date,
      data,
    }: {
      date: string;
      data: CreateDayMediaRequest;
    }) => api.media.create(date, data),
    onSuccess: (_result, { date }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dayMedia(date) });
      qc.invalidateQueries({ queryKey: ['days'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
      qc.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}

export function useUpdateDayMediaPeriod() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      date: string;
      data: UpdateDayMediaRequest;
    }) => api.media.updatePeriod(id, data),
    onSuccess: (_result, { date }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dayMedia(date) });
      qc.invalidateQueries({ queryKey: ['days'] });
      qc.invalidateQueries({ queryKey: ['event-groups'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

export function useDeleteDayMedia() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      api.media.delete(id),
    onSuccess: (_result, { date }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dayMedia(date) });
      qc.invalidateQueries({ queryKey: ['days'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
      qc.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
