import { useParams } from 'react-router-dom';
import { useResults } from '../hooks/useResults';
import { toRequestState } from '../lib/requestState';
import { QueryBoundary } from '../components/QueryBoundary';

export function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const resultsQuery = useResults(attemptId ?? '');

  return (
    <div className="page">
      <QueryBoundary state={toRequestState(resultsQuery)} onRetry={() => resultsQuery.refetch()}>
        {(results) => (
          <div className="results">
            <h1>Results</h1>
            <p className="score">
              {results.score} / {results.totalQuestions}
            </p>
            <ol className="results-list">
              {results.questions.map((question) => (
                <li key={question.id} className={question.wasCorrect ? 'result-correct' : 'result-incorrect'}>
                  <p>{question.prompt}</p>
                  <ul>
                    {question.choices.map((choice) => (
                      <li
                        key={choice.id}
                        className={[
                          choice.isCorrect ? 'choice-correct' : '',
                          choice.id === question.selectedChoiceId ? 'choice-selected' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {choice.label}
                        {choice.isCorrect ? ' ✓' : ''}
                        {choice.id === question.selectedChoiceId ? ' (your answer)' : ''}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
