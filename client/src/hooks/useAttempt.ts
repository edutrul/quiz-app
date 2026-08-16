import { useQuery } from '@tanstack/react-query';
import { ApiRequestError, fetchAttempt } from '../api/client';

export function useAttempt(attemptId: string | null) {
  return useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => fetchAttempt(attemptId as string),
    enabled: attemptId !== null,
    retry: (failureCount, error) => {
      if (error instanceof ApiRequestError && error.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
