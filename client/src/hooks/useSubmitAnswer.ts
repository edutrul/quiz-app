import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitAnswer } from '../api/client';

export function useSubmitAnswer(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, choiceId }: { questionId: number; choiceId: number }) =>
      submitAnswer(attemptId, questionId, choiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attempt', attemptId] });
    },
  });
}
