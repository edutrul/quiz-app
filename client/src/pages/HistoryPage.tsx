import { Link } from 'react-router-dom';
import { useHistory } from '../hooks/useHistory';
import { getHistoryIds } from '../lib/attemptStorage';
import { toRequestState } from '../lib/requestState';
import { QueryBoundary } from '../components/QueryBoundary';

export function HistoryPage() {
  const ids = getHistoryIds();
  const historyQuery = useHistory(ids);

  return (
    <div className="page">
      <h1>History</h1>
      <QueryBoundary
        state={toRequestState(historyQuery, (data) => data.length === 0)}
        onRetry={() => historyQuery.refetch()}
        emptyMessage="No attempts yet on this browser."
      >
        {(entries) => (
          <ul className="history-list">
            {entries.map((entry) => (
              <li key={entry.attemptId}>
                <span>{entry.quizTitle}</span>
                <span className="muted">
                  {entry.status === 'completed' ? `${entry.score} / ${entry.totalQuestions}` : 'In progress'}
                </span>
                {entry.status === 'completed' ? (
                  <Link to={`/results/${entry.attemptId}`}>View results</Link>
                ) : (
                  <Link to={`/quiz/${entry.quizId}/attempt`}>Continue</Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
