import { useQuery } from '@tanstack/react-query';
import { fetchQuizzes } from '../api/client';

export function useQuizzes() {
  return useQuery({ queryKey: ['quizzes'], queryFn: fetchQuizzes });
}
