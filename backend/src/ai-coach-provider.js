/**
 * No real provider is wired in this step. The function receives only approved
 * writing input and cancellation, never account data or database access.
 * @typedef {(input: import('./ai-coach-policy.js').CoachInput, signal: AbortSignal) => Promise<unknown>} CoachProvider
 * @typedef {{generate?: CoachProvider, timeoutMs?: number}} CoachOptions
 */

/** Only these application-owned categories may influence the public response. */
export class CoachFailure extends Error {
  /** @param {'refused' | 'unavailable' | 'timeout' | 'cancelled'} kind */
  constructor(kind) {
    super('Coach request did not complete.');
    this.kind = kind;
  }
}

/** Bound even a provider double that ignores cancellation. Late results are ignored.
 * @param {CoachProvider} generate
 * @param {import('./ai-coach-policy.js').CoachInput} input
 * @param {import('express').Response} response
 * @param {number} timeoutMs
 */
export async function requestSuggestion(generate, input, response, timeoutMs) {
  const controller = new AbortController();
  /** @type {(reason: CoachFailure) => void} */
  let rejectPending;
  const stopped = new Promise((_resolve, reject) => {
    rejectPending = reject;
  });
  /** @param {'timeout' | 'cancelled'} kind */
  const stop = (kind) => {
    rejectPending(new CoachFailure(kind));
    controller.abort();
  };
  const timer = setTimeout(() => stop('timeout'), timeoutMs);
  const onClose = () => stop('cancelled');
  response.once('close', onClose);
  try {
    return await Promise.race([
      Promise.resolve().then(() => generate(input, controller.signal)),
      stopped,
    ]);
  } finally {
    clearTimeout(timer);
    response.off('close', onClose);
  }
}
