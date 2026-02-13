import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CloseEventPeriodRequest,
  CreateEventGroupRequest,
  CreateEventPeriodRequest,
  EventGroupQueryParams,
  UpdateEventGroupRequest,
  UpdateEventPeriodRequest,
} from '@lifespan/api';
import { QUERY_KEYS, STALE_TIMES } from '@lifespan/constants';
import { useApi } from './api-context';

export function useEventGroups(params?: EventGroupQueryParams) {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.eventGroups(params),
    queryFn: () => api.eventGroups.list(params),
    staleTime: STALE_TIMES.eventGroups,
  });
}

export function useEventGroup(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.eventGroup(id),
    queryFn: () => api.eventGroups.get(id),
    staleTime: STALE_TIMES.eventGroups,
    enabled: !!id,
  });
}

export function useEventGroupDetails(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.eventGroupDetails(id),
    queryFn: () => api.eventGroups.getDetails(id),
    staleTime: STALE_TIMES.eventGroups,
    enabled: !!id,
  });
}

export function useCreateEventGroup() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventGroupRequest) => api.eventGroups.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-groups'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

export function useUpdateEventGroup() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventGroupRequest }) =>
      api.eventGroups.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-groups'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

export function useDeleteEventGroup() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.eventGroups.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-groups'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

export function useCreatePeriod() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: CreateEventPeriodRequest }) =>
      api.eventGroups.createPeriod(groupId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-groups'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
      qc.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}

export function useUpdatePeriod() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventPeriodRequest }) =>
      api.eventGroups.updatePeriod(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-groups'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
      qc.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}

export function useClosePeriod() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CloseEventPeriodRequest }) =>
      api.eventGroups.closePeriod(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-groups'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

export function useDeletePeriod() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.eventGroups.deletePeriod(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-groups'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
      qc.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
