// @todo: Make sure to use SHORT_HAND for constant name.
const ATTEMPT_KEY_PREFIX = 'qp:attempt:';
// @todo: Make sure to use SHORT_HAND for constant name.
const HISTORY_KEY = 'qp:history';

export function getStoredAttemptId(quizId: number): string | null {
  return localStorage.getItem(ATTEMPT_KEY_PREFIX + quizId);
}

export function setStoredAttemptId(quizId: number, attemptId: string): void {
  localStorage.setItem(ATTEMPT_KEY_PREFIX + quizId, attemptId);
}

export function clearStoredAttemptId(quizId: number): void {
  localStorage.removeItem(ATTEMPT_KEY_PREFIX + quizId);
}

export function getHistoryIds(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addHistoryId(attemptId: string): void {
  const ids = getHistoryIds();
  if (!ids.includes(attemptId)) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([...ids, attemptId]));
  }
}
