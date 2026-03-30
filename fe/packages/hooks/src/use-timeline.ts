import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type {
  TimelineQueryParams,
  TimelineResponse,
  WeekQueryParams,
} from '@timeflux/api';
import { QUERY_KEYS, STALE_TIMES } from '@timeflux/constants';
import { useApi } from './api-context';

export function useTimeline(
  params?: TimelineQueryParams,
  options?: { enabled?: boolean },
) {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.timeline(params),
    queryFn: () => api.timeline.get(params),
    staleTime: STALE_TIMES.timeline,
    enabled: options?.enabled,
  });
}

const PAGE_MONTHS = 6;

interface InfiniteTimelineParams {
  /** Earliest possible date (e.g. user birth date). Pages won't go before this. */
  startDate?: string;
  enabled?: boolean;
}

/** Paginated timeline: each page = 6 months, loads backwards. */
export function useInfiniteTimeline({
  startDate,
  enabled = true,
}: InfiniteTimelineParams) {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: ['timeline', 'infinite', startDate ?? ''],
    queryFn: async ({ pageParam }) => {
      const to = pageParam;
      const toDate = new Date(to);
      toDate.setMonth(toDate.getMonth() - PAGE_MONTHS);
      let from = toDate.toISOString().split('T')[0];
      if (startDate && from < startDate) from = startDate;
      return api.timeline.get({ from, to });
    },
    initialPageParam: new Date().toISOString().split('T')[0],
    getNextPageParam: (lastPage) => {
      if (startDate && lastPage.from <= startDate) return undefined;
      return lastPage.from;
    },
    staleTime: STALE_TIMES.timeline,
    enabled,
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
