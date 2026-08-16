import type { ReactNode } from 'react';
import type { RequestState } from '../lib/requestState';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';

interface QueryBoundaryProps<T> {
  state: RequestState<T>;
  onRetry?: () => void;
  emptyMessage?: string;
  children: (data: T) => ReactNode;
}

export function QueryBoundary<T>({ state, onRetry, emptyMessage, children }: QueryBoundaryProps<T>) {
  switch (state.status) {
    case 'loading':
      return <LoadingState />;
    case 'error':
      return <ErrorState message={state.error} onRetry={onRetry} />;
    case 'empty':
      return <EmptyState message={emptyMessage} />;
    case 'success':
      return <>{children(state.data)}</>;
  }
}
