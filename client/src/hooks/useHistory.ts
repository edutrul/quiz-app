import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '../api/client';

export function useHistory(ids: string[]) {
  return useQuery({
    queryKey: ['history', ids],
    queryFn: () => fetchHistory(ids),
  });
}
