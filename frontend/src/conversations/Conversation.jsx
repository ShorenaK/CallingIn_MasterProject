import { useEffect, useRef, useState } from 'react';
import { Problem } from '../invitations/Problem.jsx';
import { formatDate } from '../invitations/format.js';
import { MESSAGE_MAX } from './api.js';
import { useConversation, useMessageHistory } from './useConversation.js';
import { useReply } from './useReply.js';
import './conversations.css';

/** @typedef {{invitation: import('../invitations/api.js').Invitation, userId: string, expired: boolean, onExpired: () => void, onSignIn: () => void, onBack: () => void}} ConversationProps */

/** @param {ConversationProps} props */
export function Conversation(props) {
  const { invitation, userId, expired, onExpired } = props;
  const opening = useConversation(invitation.id, userId, onExpired);
  const history = useMessageHistory(opening.room?.id, onExpired);
  const reply = useReply({
    roomId: opening.room?.id,
    userId,
    expired,
    onExpired,
    onSent: history.add,
  });
  const [confirming, setConfirming] = useState(false);
  return (
    <section
      className="invitation-panel conversation-panel"
      aria-labelledby="conversation-title"
    >
      <ConversationHeading
        {...props}
        reply={reply}
        confirming={confirming}
        setConfirming={setConfirming}
      />
      <details className="conversation-context">
        <summary>Invitation message</summary>
        <p className="invitation-message">{invitation.message}</p>
      </details>
      <OpeningStatus opening={opening} expired={expired} />
      {opening.room && (
        <MessageHistory
          history={history}
          userId={userId}
          expired={expired}
          sending={reply.busy}
          otherName={invitation.otherPerson?.displayName || 'Other participant'}
        />
      )}
      <ReplyComposer
        reply={reply}
        expired={expired}
        ready={
          Boolean(opening.room) && history.status === 'ready' && !confirming
        }
      />
    </section>
  );
}

/** @typedef {{history: ReturnType<typeof useMessageHistory>, userId: string, otherName: string, expired: boolean, sending: boolean}} HistoryProps */
/** @param {HistoryProps} props */
function MessageHistory({ history, userId, otherName, expired, sending }) {
  return (
    <section className="message-history" aria-labelledby="messages-title">
      <h4 id="messages-title">Messages</h4>
      <p className="field-hint">
        Use Refresh messages to check for new replies.
      </p>
      <button
        type="button"
        className="secondary-button"
        onClick={history.refresh}
        disabled={expired || sending || history.status === 'loading'}
      >
        Refresh messages
      </button>
      {history.status === 'loading' && <p role="status">Loading messages…</p>}
      {history.status === 'error' && (
        <Problem
          message={history.error}
          onRetry={expired ? undefined : history.refresh}
        />
      )}
      {history.status === 'ready' && (
        <HistoryContent
          history={history}
          userId={userId}
          otherName={otherName}
          expired={expired}
          sending={sending}
        />
      )}
      <p className="visually-hidden" role="status">
        {history.notice}
      </p>
    </section>
  );
}

/** @param {{message: import('./api.js').Message, own: boolean, name: string, focused: boolean}} props */
function MessageItem({ message, own, name, focused }) {
  const item = useRef(/** @type {HTMLLIElement | null} */ (null));
  useEffect(() => {
    if (focused) item.current?.focus();
  }, [focused]);
  return (
    <li
      ref={item}
      tabIndex={-1}
      className={`conversation-message ${own ? 'message-own' : ''}`}
    >
      <p className="message-author">
        <strong>{name}</strong>
        {' · '}
        <time dateTime={message.createdAt}>
          {formatDate(message.createdAt)}
        </time>
      </p>
      <p className="invitation-message">{message.text}</p>
    </li>
  );
}

/** @param {{reply: ReturnType<typeof useReply>, expired: boolean, ready: boolean}} props */
function ReplyComposer({ reply, expired, ready }) {
  return (
    <form
      className="reply-composer"
      aria-busy={reply.busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) void reply.send();
      }}
    >
      <ReplyFields reply={reply} expired={expired} ready={ready} />
      {reply.error && <Problem message={reply.error} />}
      <p role="status">{reply.notice}</p>
      <button
        type="submit"
        disabled={!ready || expired || reply.busy || !reply.valid}
      >
        {reply.busy ? 'Sending…' : 'Send reply'}
      </button>
      <p className="field-hint">
        Unsent replies stay on this page only. Copy your text before signing out
        or reloading.
      </p>
    </form>
  );
}

/** @param {{onKeep: () => void, onLeave: () => void}} props */
function LeaveConfirmation({ onKeep, onLeave }) {
  const question = useRef(/** @type {HTMLParagraphElement | null} */ (null));
  useEffect(() => {
    question.current?.focus();
  }, []);
  return (
    <div
      className="invitation-confirm"
      role="group"
      aria-labelledby="leave-conversation-question"
    >
      <p id="leave-conversation-question" ref={question} tabIndex={-1}>
        Discard this unsent reply and return to invitations?
      </p>
      <div className="invitation-actions">
        <button type="button" className="secondary-button" onClick={onKeep}>
          Keep writing
        </button>
        <button type="button" onClick={onLeave}>
          Discard reply and go back
        </button>
      </div>
    </div>
  );
}

/** @param {ConversationProps & {reply: ReturnType<typeof useReply>, confirming: boolean, setConfirming: (value: boolean) => void}} props */
function ConversationHeading({
  invitation,
  expired,
  onSignIn,
  onBack,
  reply,
  confirming,
  setConfirming,
}) {
  const title = useRef(/** @type {HTMLHeadingElement | null} */ (null));
  const back = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const previous = useRef(false);
  useEffect(() => {
    title.current?.focus();
  }, []);
  useEffect(() => {
    if (previous.current && !confirming) back.current?.focus();
    previous.current = confirming;
  }, [confirming]);
  return (
    <>
      <h3 id="conversation-title" ref={title} tabIndex={-1}>
        Conversation with{' '}
        {invitation.otherPerson?.displayName || 'your participant'}
      </h3>
      <button
        type="button"
        className="secondary-button"
        ref={back}
        disabled={reply.busy}
        onClick={() => (reply.text.length ? setConfirming(true) : onBack())}
      >
        Back to invitations
      </button>
      {confirming && (
        <LeaveConfirmation
          onKeep={() => setConfirming(false)}
          onLeave={onBack}
        />
      )}
      {expired && (
        <Problem
          message="Your session has ended. Copy any unsent reply before signing in again."
          onRetry={onSignIn}
          actionLabel="Sign in again"
        />
      )}
    </>
  );
}

/** @param {{opening: ReturnType<typeof useConversation>, expired: boolean}} props */
function OpeningStatus({ opening, expired }) {
  if (expired || opening.room) return null;
  return opening.error ? (
    <Problem message={opening.error} onRetry={opening.retry} />
  ) : (
    <p role="status">Opening conversation…</p>
  );
}

/** @param {HistoryProps} props */
function HistoryContent({ history, userId, otherName, expired }) {
  return (
    <>
      {history.nextCursor && (
        <button
          type="button"
          className="secondary-button"
          onClick={() => void history.loadOlder()}
          disabled={expired || history.busy}
        >
          {history.busy ? 'Loading…' : 'Load older messages'}
        </button>
      )}
      {history.moreError && (
        <Problem
          message={history.moreError}
          onRetry={expired ? undefined : history.loadOlder}
        />
      )}
      {history.messages.length === 0 && (
        <p className="empty-state">
          No messages yet. Write the first reply when you’re ready.
        </p>
      )}
      <ol className="conversation-messages" aria-label="Message history">
        {[...history.messages].reverse().map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            own={message.senderId === userId}
            name={message.senderId === userId ? 'You' : otherName}
            focused={message.id === history.focusId}
          />
        ))}
      </ol>
    </>
  );
}

/** @param {{reply: ReturnType<typeof useReply>, expired: boolean, ready: boolean}} props */
function ReplyFields({ reply, expired, ready }) {
  const input = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const length = reply.text.trim().length;
  const over = length > MESSAGE_MAX;
  useEffect(() => {
    if (expired || (!reply.busy && (reply.notice || reply.error)))
      input.current?.focus();
  }, [expired, reply.busy, reply.notice, reply.error]);
  return (
    <>
      <label className="form-field" htmlFor="conversation-reply">
        <span>{expired ? 'Your unsent reply' : 'Your reply'}</span>
        <textarea
          id="conversation-reply"
          ref={input}
          rows={5}
          value={reply.text}
          readOnly={expired || reply.busy || !ready}
          aria-invalid={over || undefined}
          aria-describedby="reply-hint reply-count"
          onChange={(event) => reply.setText(event.target.value)}
        />
      </label>
      <p id="reply-hint" className="field-hint">
        Up to 5,000 characters; some emoji count as two. Enter adds a new line.
        Choose Send reply to send.
      </p>
      <p
        id="reply-count"
        className={`message-count ${over ? 'count-over' : ''}`}
      >
        {length.toLocaleString()} of 5,000 characters
      </p>
      <p className="visually-hidden" role="status">
        {over ? 'Your reply is over the 5,000-character limit.' : ''}
      </p>
    </>
  );
}
