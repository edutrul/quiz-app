import { useNavigate } from 'react-router-dom';
import { useQuizzes } from '../hooks/useQuizzes';
import { useStartAttempt } from '../hooks/useStartAttempt';
import { toRequestState } from '../lib/requestState';
import { QueryBoundary } from '../components/QueryBoundary';
import { addHistoryId, getStoredAttemptId, setStoredAttemptId } from '../lib/attemptStorage';

export function QuizListPage() {
  const quizzesQuery = useQuizzes();
  const startAttempt = useStartAttempt();
  const navigate = useNavigate();

  async function handleStart(quizId: number) {
    if (getStoredAttemptId(quizId) !== null) {
      navigate(`/quiz/${quizId}/attempt`);
      return;
    }
    const attempt = await startAttempt.mutateAsync(quizId);
    setStoredAttemptId(quizId, attempt.attemptId);
    addHistoryId(attempt.attemptId);
    navigate(`/quiz/${quizId}/attempt`);
  }

  return (
    <div className="page">
      <h1>Quizzes</h1>
      <QueryBoundary
        state={toRequestState(quizzesQuery, (data) => data.length === 0)}
        onRetry={() => quizzesQuery.refetch()}
        emptyMessage="No quizzes available yet."
      >
        {(quizzes) => (
          <ul className="quiz-list">
            {quizzes.map((quiz) => {
              const inProgress = getStoredAttemptId(quiz.id) !== null;
              return (
                <li key={quiz.id} className="quiz-list-item">
                  <div>
                    <h2>{quiz.title}</h2>
                    {quiz.description && <p>{quiz.description}</p>}
                    <p className="muted">{quiz.questionCount} questions</p>
                  </div>
                  <button type="button" onClick={() => handleStart(quiz.id)} disabled={startAttempt.isPending}>
                    {inProgress ? 'Continue' : 'Start'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </QueryBoundary>
      {startAttempt.isError && <p className="inline-error">{startAttempt.error.message}</p>}
    </div>
  );
}
