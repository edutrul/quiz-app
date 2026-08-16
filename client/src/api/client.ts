import type {
  AttemptResults,
  AttemptStart,
  AttemptState,
  CompleteAttemptResponse,
  HistoryEntry,
  Quiz,
  SubmitAnswerResponse,
} from './types';

export class ApiRequestError extends Error {
  status: number;
  code: string;
  extra: Record<string, unknown>;

  constructor(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  const body = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiRequestError(
      res.status,
      body?.error ?? 'unknown_error',
      body?.message ?? 'Request failed',
      body ?? {}
    );
  }

  return body as T;
}

export function fetchQuizzes(): Promise<Quiz[]> {
  return request<Quiz[]>('/quizzes');
}

export function startAttempt(quizId: number): Promise<AttemptStart> {
  return request<AttemptStart>(`/quizzes/${quizId}/attempts`, { method: 'POST' });
}

export function fetchAttempt(attemptId: string): Promise<AttemptState> {
  return request<AttemptState>(`/attempts/${attemptId}`);
}

export function submitAnswer(
  attemptId: string,
  questionId: number,
  choiceId: number
): Promise<SubmitAnswerResponse> {
  return request<SubmitAnswerResponse>(`/attempts/${attemptId}/answers/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify({ choiceId }),
  });
}

export function completeAttempt(attemptId: string): Promise<CompleteAttemptResponse> {
  return request<CompleteAttemptResponse>(`/attempts/${attemptId}/complete`, { method: 'POST' });
}

export function fetchResults(attemptId: string): Promise<AttemptResults> {
  return request<AttemptResults>(`/attempts/${attemptId}/results`);
}

export function fetchHistory(ids: string[]): Promise<HistoryEntry[]> {
  if (ids.length === 0) {
    return Promise.resolve([]);
  }
  return request<HistoryEntry[]>(`/attempts?ids=${ids.map(encodeURIComponent).join(',')}`);
}
