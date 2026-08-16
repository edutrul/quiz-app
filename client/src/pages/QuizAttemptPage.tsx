import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAttempt } from '../hooks/useAttempt';
import { useStartAttempt } from '../hooks/useStartAttempt';
import { useSubmitAnswer } from '../hooks/useSubmitAnswer';
import { useCompleteAttempt } from '../hooks/useCompleteAttempt';
import { ApiRequestError } from '../api/client';
import {
  addHistoryId,
  clearStoredAttemptId,
  getStoredAttemptId,
  setStoredAttemptId,
} from '../lib/attemptStorage';
import { toRequestState } from '../lib/requestState';
import { QueryBoundary } from '../components/QueryBoundary';
import { QuestionCard } from '../components/QuestionCard';

export function QuizAttemptPage() {
  const { quizId: quizIdParam } = useParams<{ quizId: string }>();
  const quizId = Number(quizIdParam);
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState<string | null>(() => getStoredAttemptId(quizId));
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);

  const startAttempt = useStartAttempt();
  const attemptQuery = useAttempt(attemptId);
  const submitAnswer = useSubmitAnswer(attemptId ?? '');
  const completeAttempt = useCompleteAttempt(attemptId ?? '');

  // No stored attempt for this quiz yet — start a new one.
  useEffect(() => {
    if (attemptId !== null || startAttempt.isPending) return;
    startAttempt.mutate(quizId, {
      onSuccess: (attempt) => {
        setStoredAttemptId(quizId, attempt.attemptId);
        addHistoryId(attempt.attemptId);
        setAttemptId(attempt.attemptId);
      },
    });
  }, [attemptId, quizId, startAttempt]);

  // Stored attempt id turned out to be stale (e.g. dev DB reset) — clear it and restart.
  useEffect(() => {
    if (attemptId && attemptQuery.error instanceof ApiRequestError && attemptQuery.error.status === 404) {
      clearStoredAttemptId(quizId);
      setAttemptId(null);
    }
  }, [attemptQuery.error, attemptId, quizId]);

  // Attempt is already completed (e.g. user came back to this URL) — go straight to results.
  useEffect(() => {
    if (attemptQuery.data?.status === 'completed') {
      navigate(`/results/${attemptQuery.data.attemptId}`, { replace: true });
    }
  }, [attemptQuery.data, navigate]);

  const currentQuestion = useMemo(
    () => attemptQuery.data?.questions.find((q) => q.answeredChoiceId === null) ?? null,
    [attemptQuery.data]
  );

  useEffect(() => {
    setSelectedChoiceId(currentQuestion?.answeredChoiceId ?? null);
  }, [currentQuestion?.id, currentQuestion?.answeredChoiceId]);

  if (attemptId === null) {
    return <p className="state state-loading">Starting quiz…</p>;
  }

  return (
    <div className="page">
      <QueryBoundary state={toRequestState(attemptQuery)} onRetry={() => attemptQuery.refetch()}>
        {(attempt) => {
          const answeredCount = attempt.questions.filter((q) => q.answeredChoiceId !== null).length;

          return (
            <div className="attempt">
              <p className="muted">
                Question {Math.min(answeredCount + 1, attempt.totalQuestions)} of {attempt.totalQuestions}
              </p>

              {currentQuestion ? (
                <>
                  <QuestionCard
                    prompt={currentQuestion.prompt}
                    choices={currentQuestion.choices}
                    selectedChoiceId={selectedChoiceId}
                    onSelect={setSelectedChoiceId}
                    disabled={submitAnswer.isPending}
                  />
                  <button
                    type="button"
                    disabled={selectedChoiceId === null || submitAnswer.isPending}
                    onClick={() =>
                      selectedChoiceId !== null &&
                      submitAnswer.mutate({ questionId: currentQuestion.id, choiceId: selectedChoiceId })
                    }
                  >
                    Submit answer
                  </button>
                  {submitAnswer.isError && <p className="inline-error">{submitAnswer.error.message}</p>}
                </>
              ) : (
                <div>
                  <p>All questions answered.</p>
                  <button
                    type="button"
                    disabled={completeAttempt.isPending}
                    onClick={() =>
                      completeAttempt.mutate(undefined, {
                        onSuccess: (result) => navigate(`/results/${result.attemptId}`),
                      })
                    }
                  >
                    See results
                  </button>
                  {completeAttempt.isError && <p className="inline-error">{completeAttempt.error.message}</p>}
                </div>
              )}
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
