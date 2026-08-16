export type RequestState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'empty' }
  | { status: 'success'; data: T };

interface QueryLike<T> {
  status: 'pending' | 'error' | 'success';
  data: T | undefined;
  error: Error | null;
}

export function toRequestState<T>(query: QueryLike<T>, isEmpty?: (data: T) => boolean): RequestState<T> {
  if (query.status === 'pending') {
    return { status: 'loading' };
  }
  if (query.status === 'error') {
    return { status: 'error', error: query.error?.message ?? 'Something went wrong' };
  }
  const data = query.data as T;
  if (isEmpty?.(data)) {
    return { status: 'empty' };
  }
  return { status: 'success', data };
}
