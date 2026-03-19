interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-label="Loading">
      <div className="loading-spinner" />
      <p>{message}</p>
    </div>
  );
}
