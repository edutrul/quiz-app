export function EmptyState({ message = 'Nothing here yet.' }: { message?: string }) {
  return <div className="state state-empty">{message}</div>;
}
