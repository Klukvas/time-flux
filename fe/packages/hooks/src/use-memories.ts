import { useQuery } from '@tanstack/react-query';
import type { MemoriesContextMode } from '@lifespan/api';
import { QUERY_KEYS, STALE_TIMES } from '@lifespan/constants';
import { useApi } from './api-context';

export function useOnThisDay(date?: string) {
  const api = useApi();
  return useQuery({
    queryKey: date ? [...QUERY_KEYS.onThisDay, date] : QUERY_KEYS.onThisDay,
    queryFn: () => api.memories.onThisDay(date),
    staleTime: STALE_TIMES.memories,
  });
}

export function useMemoriesContext(mode: MemoriesContextMode, date: string) {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.memoriesContext(mode, date),
    queryFn: () => api.memories.context({ mode, date }),
    staleTime: STALE_TIMES.memories,
    enabled: !!date,
  });
}
