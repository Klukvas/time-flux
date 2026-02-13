import { useQuery } from '@tanstack/react-query';
import type { TimelineQueryParams, WeekQueryParams } from '@lifespan/api';
import { QUERY_KEYS, STALE_TIMES } from '@lifespan/constants';
import { useApi } from './api-context';

export function useTimeline(params?: TimelineQueryParams) {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.timeline(params),
    queryFn: () => api.timeline.get(params),
    staleTime: STALE_TIMES.timeline,
  });
}

export function useWeekTimeline(params: WeekQueryParams) {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.week(params.date),
    queryFn: () => api.timeline.week(params),
    staleTime: STALE_TIMES.timeline,
  });
}
