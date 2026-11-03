import { expect } from '@playwright/test';
import { mockApi } from './helpers.js';

export const user = {
  id: '000000000000000000000001',
  displayName: 'Shorena',
  email: 'shorena@example.com',
};
export const partnerId = '000000000000000000000002';
export const invitationId = '0000000000000000000000a1';
export const roomId = '0000000000000000000000c1';
export const room = {
  id: roomId,
  invitationId,
  participantIds: [user.id, partnerId],
  createdAt: '2026-11-03T12:00:00.000Z',
};
export const accepted = {
  id: invitationId,
  senderId: partnerId,
  recipientId: user.id,
  message: 'Would you like to talk?',
  status: 'accepted',
  createdAt: room.createdAt,
  updatedAt: room.createdAt,
  respondedAt: room.createdAt,
  otherPerson: { displayName: 'Sarah' },
};

export function message(
  number,
  text = `Message ${number}`,
  senderId = partnerId,
) {
  return {
    id: number.toString(16).padStart(24, '0'),
    conversationId: roomId,
    senderId,
    text,
    createdAt: new Date(Date.UTC(2026, 10, 3, 12, number)).toISOString(),
  };
}

export async function mockConversation(page, options = {}) {
  const state = {
    messages: options.messages ?? [],
    nextCursor: options.nextCursor ?? null,
    reads: [],
    sends: [],
    openFailure: null,
    historyHandler: null,
    sendFailure: null,
    battery: 'space',
    batteryFailure: null,
    direction: options.direction ?? 'incoming',
  };
  await mockApi(page, (route, path, url) => handle(route, path, url, state), {
    user,
  });
  return state;
}

async function handle(route, path, url, state) {
  if (path === '/api/invitations') {
    await route.fulfill({
      json: {
        invitations:
          url.searchParams.get('direction') === state.direction
            ? [accepted]
            : [],
        nextCursor: null,
      },
    });
  } else if (path.endsWith('/conversation')) {
    await route.fulfill(state.openFailure ?? { json: { conversation: room } });
  } else if (path === `/api/conversations/${roomId}/social-battery`) {
    await route.fulfill(
      state.batteryFailure ?? { json: { status: state.battery } },
    );
  } else if (path === `/api/conversations/${roomId}/messages`) {
    await messages(route, url, state);
  } else if (path === '/api/users/lookup') {
    await route.fulfill({
      json: { user: { id: partnerId, displayName: 'Sarah' } },
    });
  } else return false;
  return true;
}

async function messages(route, url, state) {
  if (route.request().method() === 'POST') {
    state.sends.push(route.request().postDataJSON());
    if (state.sendFailure) return route.fulfill(state.sendFailure);
    const sent = message(
      30 + state.sends.length,
      route.request().postDataJSON().text.trim(),
      user.id,
    );
    state.messages.unshift(sent);
    return route.fulfill({ json: { message: sent } });
  }
  state.reads.push(Object.fromEntries(url.searchParams));
  if (state.historyHandler) return state.historyHandler(route, url);
  return route.fulfill({
    json: { messages: state.messages, nextCursor: state.nextCursor },
  });
}

export async function openRoom(page, direction = 'incoming') {
  await page.goto('/');
  await page
    .getByRole('region', {
      name: direction === 'incoming' ? 'Received' : 'Sent',
      exact: true,
    })
    .getByRole('button', { name: 'Open conversation' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Conversation with Sarah' }),
  ).toBeFocused();
  return page.getByRole('region', {
    name: 'Conversation with Sarah',
    exact: true,
  });
}
