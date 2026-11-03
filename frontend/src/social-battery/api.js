import { apiRequest } from '../account/api.js';

/** @typedef {'open' | 'busy' | 'space'} BatteryStatus */
export const choices = [
  {
    value: 'open',
    label: 'Open to Conversations',
    description: 'I’m open to meaningful conversations.',
    segments: 4,
  },
  {
    value: 'busy',
    label: 'Busy',
    description: 'I’m focused on other things right now.',
    segments: 2,
  },
  {
    value: 'space',
    label: 'Taking Personal Space',
    description: 'I need some time for myself.',
    segments: 1,
  },
];

/** @param {string} path @param {RequestInit} [options] @returns {Promise<BatteryStatus | null>} */
export async function batteryRequest(path, options) {
  const data = /** @type {{status?: unknown} | null} */ (
    await apiRequest(path, options)
  );
  if (
    !data ||
    !(
      data.status === null ||
      choices.some((choice) => choice.value === data.status)
    )
  )
    throw new Error(
      'The server returned an unexpected Social Battery response. Please try again.',
    );
  return /** @type {BatteryStatus | null} */ (data.status);
}
