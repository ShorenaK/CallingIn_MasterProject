import { apiRequest } from '../account/api.js';
import { hasMessageContent } from '../message-content.js';
import { MESSAGE_MAX } from '../invitations/api.js';

/** @typedef {{action: 'draft' | 'refine', text: string, tone: 'natural' | 'warm' | 'direct'}} CoachInput */

/** @param {string} text */
export function validCoachText(text) {
  return hasMessageContent(text) && text.trim().length <= MESSAGE_MAX;
}

/** @param {CoachInput} input @param {AbortSignal} signal */
export async function generateSuggestion(input, signal) {
  const data = await apiRequest('/api/ai-coach/suggestions', {
    method: 'POST',
    body: JSON.stringify(input),
    signal,
  });
  const result = /** @type {{suggestion?: unknown} | null} */ (data);
  if (
    typeof result?.suggestion !== 'string' ||
    !validCoachText(result.suggestion)
  )
    throw new Error(
      'AI Coach returned an invalid suggestion. Your message is unchanged.',
    );
  return result.suggestion.trim();
}
