import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '@lifespan/api';
import { QUERY_KEYS, STALE_TIMES } from '@lifespan/constants';
import { useApi } from './api-context';

export function useCategories() {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: () => api.categories.list(),
    staleTime: STALE_TIMES.categories,
  });
}

export function useCreateCategory() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => api.categories.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.categories }),
  });
}

export function useUpdateCategory() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      api.categories.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      qc.invalidateQueries({ queryKey: ['timeline'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useDeleteCategory() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.categories.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.categories }),
  });
}
