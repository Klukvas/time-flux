import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, STALE_TIMES } from '@lifespan/constants';
import { useApi } from './api-context';

export function useMoodOverview() {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.moodOverview,
    queryFn: () => api.analytics.moodOverview(),
    staleTime: STALE_TIMES.analytics,
  });
}
