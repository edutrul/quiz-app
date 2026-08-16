import { useMutation } from '@tanstack/react-query';
import { startAttempt } from '../api/client';

export function useStartAttempt() {
  return useMutation({
    mutationFn: (quizId: number) => startAttempt(quizId),
  });
}
