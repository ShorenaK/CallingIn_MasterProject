/**
 * Calm amber notice for invitation problems: icon and words, not red alone.
 * @param {{message: string, onRetry?: () => void}} props
 */
export function Problem({ message, onRetry }) {
  return (
    <div className="invitation-problem" role="alert">
      <p>
        <span aria-hidden="true">ⓘ</span> {message}
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
