import { useQuery } from '@tanstack/react-query';
import { fetchResults } from '../api/client';

export function useResults(attemptId: string) {
  return useQuery({ queryKey: ['results', attemptId], queryFn: () => fetchResults(attemptId) });
}
