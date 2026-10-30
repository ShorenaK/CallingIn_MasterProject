/**
 * Calm amber notice for invitation problems: icon and words, not red alone.
 * @param {{message: string, onRetry?: () => void, actionLabel?: string}} props
 */
export function Problem({ message, onRetry, actionLabel = 'Try again' }) {
  return (
    <div className="invitation-problem" role="alert">
      <p>
        <span aria-hidden="true">ⓘ</span> {message}
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
