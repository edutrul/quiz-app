import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeAttempt } from '../api/client';

export function useCompleteAttempt(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => completeAttempt(attemptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attempt', attemptId] });
    },
  });
}
