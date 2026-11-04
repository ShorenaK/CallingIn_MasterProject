import { validInvitationMessage } from './invitation-policy.js';

/** @typedef {{action: 'draft' | 'refine', text: string, tone: 'natural' | 'warm' | 'direct'}} CoachInput */

/** Match invitation text limits without removing multilingual joiners.
 * @param {unknown} text
 * @returns {text is string}
 */
export function validCoachText(text) {
  return validInvitationMessage(text);
}

/** @param {unknown} body @returns {body is CoachInput} */
export function validCoachInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const input = /** @type {Partial<CoachInput>} */ (body);
  return (
    Object.keys(body).every((key) =>
      ['action', 'text', 'tone'].includes(key),
    ) &&
    typeof input.action === 'string' &&
    ['draft', 'refine'].includes(input.action) &&
    typeof input.tone === 'string' &&
    ['natural', 'warm', 'direct'].includes(input.tone) &&
    validCoachText(input.text)
  );
}
