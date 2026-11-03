import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';
import {
  mockConversation,
  openRoom,
  message,
  roomId,
} from './conversation-helpers.js';

const failure = (status) => ({
  status,
  json: {
    error: status === 401 ? 'Sign in to continue.' : 'Temporarily unavailable.',
  },
});

for (const response of [
  failure(503),
  { json: { messages: [{ text: 'Malformed' }], nextCursor: null } },
]) {
  test(`history failure can retry safely: ${JSON.stringify(response)}`, async ({
    page,
  }) => {
    const state = await mockConversation(page);
    state.historyHandler = (route) => route.fulfill(response);
    const panel = await openRoom(page);
    await expect(panel.getByRole('alert')).toBeVisible();
    await expect(
      panel.getByRole('button', { name: 'Send reply' }),
    ).toBeDisabled();
    state.historyHandler = null;
    await panel.getByRole('button', { name: 'Try again' }).click();
    await expect(panel).toContainText('No messages yet.');
  });
}

test('older history failure keeps current messages and draft, then retries', async ({
  page,
}) => {
  const state = await mockConversation(page, {
    messages: [message(3)],
    nextCursor: 'older',
  });
  let fail = true;
  state.historyHandler = (route, url) =>
    route.fulfill(
      url.searchParams.has('cursor')
        ? fail
          ? failure(503)
          : { json: { messages: [message(1)], nextCursor: null } }
        : { json: { messages: state.messages, nextCursor: 'older' } },
    );
  const panel = await openRoom(page);
  await panel
    .getByRole('textbox', { name: 'Your reply', exact: true })
    .fill('Retained draft');
  await panel.getByRole('button', { name: 'Load older messages' }).click();
  await expect(panel.getByRole('alert')).toContainText(
    'Temporarily unavailable',
  );
  await expect(panel.getByRole('list')).toContainText('Message 3');
  await expect(
    panel.getByRole('textbox', { name: 'Your reply', exact: true }),
  ).toHaveValue('Retained draft');
  fail = false;
  await panel.getByRole('button', { name: 'Try again' }).click();
  await expect(
    panel.getByRole('listitem').filter({ hasText: 'Message 1' }),
  ).toBeFocused();
});

for (const status of [200, 401, 503]) {
  test(`stale older response ${status} cannot replace a refresh or expire the session`, async ({
    page,
  }) => {
    const state = await mockConversation(page, {
      messages: [message(3)],
      nextCursor: 'older',
    });
    let release;
    const held = new Promise((resolve) => {
      release = resolve;
    });
    let started;
    const requested = new Promise((resolve) => {
      started = resolve;
    });
    state.historyHandler = async (route, url) => {
      if (url.searchParams.has('cursor')) {
        started();
        await held;
        await route.fulfill(
          status === 200
            ? {
                json: {
                  messages: [message(1, 'Stale old message')],
                  nextCursor: null,
                },
              }
            : failure(status),
        );
      } else
        await route.fulfill({
          json: { messages: state.messages, nextCursor: state.nextCursor },
        });
    };
    const panel = await openRoom(page);
    await panel.getByRole('button', { name: 'Load older messages' }).click();
    await requested;
    state.messages = [message(4, 'Fresh result')];
    state.nextCursor = null;
    await panel.getByRole('button', { name: 'Refresh messages' }).click();
    await expect(panel.getByRole('list')).toContainText('Fresh result');
    const finished = page.waitForResponse((response) =>
      response.url().includes('cursor=older'),
    );
    release();
    await finished;
    await expect(panel.getByRole('list')).not.toContainText(
      'Stale old message',
    );
    await expect(
      panel.getByRole('textbox', { name: 'Your reply', exact: true }),
    ).toBeEditable();
    await expect(panel.getByRole('alert')).toHaveCount(0);
  });
}

test('opening a conversation preserves an existing invitation draft', async ({
  page,
}) => {
  await mockConversation(page);
  await page.goto('/');
  await page
    .getByRole('textbox', { name: 'Their email address' })
    .fill('sarah@example.com');
  await page.getByRole('button', { name: 'Find person' }).click();
  await page
    .getByRole('textbox', { name: 'Your message', exact: true })
    .fill('My invitation draft');
  await page.getByRole('button', { name: 'Open conversation' }).click();
  await expect(
    page.getByRole('heading', { name: 'Conversation with Sarah' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Back to invitations' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Your message', exact: true }),
  ).toHaveValue('My invitation draft');
});

test('pending send prevents duplicate sends and navigation', async ({
  page,
}) => {
  await mockConversation(page);
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/conversations/${roomId}/messages`, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await held;
    await route.fulfill({
      json: {
        message: {
          ...message(40, 'One send'),
          senderId: '000000000000000000000001',
        },
      },
    });
  });
  const panel = await openRoom(page);
  await panel
    .getByRole('textbox', { name: 'Your reply', exact: true })
    .fill('One send');
  await panel.getByRole('button', { name: 'Send reply' }).click();
  await expect(panel.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  await expect(
    panel.getByRole('button', { name: 'Back to invitations' }),
  ).toBeDisabled();
  await expect(
    panel.getByRole('textbox', { name: 'Your reply', exact: true }),
  ).toHaveAttribute('readonly', '');
  release();
  await expect(
    panel.getByRole('textbox', { name: 'Your reply', exact: true }),
  ).toBeEmpty();
});

test('availability error does not block messaging; expiry retains the reply', async ({
  page,
}) => {
  const state = await mockConversation(page);
  const panel = await openRoom(page);
  const input = panel.getByRole('textbox', { name: 'Your reply', exact: true });
  await input.fill('Keep my reply');
  state.batteryFailure = failure(503);
  await panel.getByRole('button', { name: 'Refresh availability' }).click();
  await expect(panel.getByRole('alert')).toContainText(
    'Temporarily unavailable',
  );
  await expect(panel.getByRole('button', { name: 'Send reply' })).toBeEnabled();
  state.batteryFailure = failure(401);
  await panel.getByRole('button', { name: 'Refresh availability' }).click();
  await expect(
    panel.getByRole('textbox', { name: 'Your unsent reply' }),
  ).toHaveValue('Keep my reply');
  await expect(
    panel.getByRole('textbox', { name: 'Your unsent reply' }),
  ).toBeFocused();
  await expect(panel.getByRole('alert')).toHaveCount(1);
  await expect(panel.getByRole('alert')).toContainText(
    'Your session has ended. Copy any unsent reply',
  );
  await expect(
    panel.getByRole('region', { name: 'Sarah’s Social Battery' }),
  ).toHaveCount(0);
  await expectAccessible(page);
});

test('a late older-history 401 after returning cannot expire the invitation screen', async ({
  page,
}) => {
  const state = await mockConversation(page, {
    messages: [message(3)],
    nextCursor: 'older',
  });
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  let started;
  const requested = new Promise((resolve) => {
    started = resolve;
  });
  state.historyHandler = async (route, url) => {
    if (url.searchParams.has('cursor')) {
      started();
      await held;
      return route.fulfill(failure(401));
    }
    return route.fulfill({
      json: { messages: state.messages, nextCursor: 'older' },
    });
  };
  const panel = await openRoom(page);
  await panel.getByRole('button', { name: 'Load older messages' }).click();
  await requested;
  await panel.getByRole('button', { name: 'Back to invitations' }).click();
  const finished = page.waitForResponse((response) =>
    response.url().includes('cursor=older'),
  );
  release();
  await finished;
  await expect(
    page.getByRole('button', { name: 'Open conversation' }),
  ).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toHaveCount(
    0,
  );
});

test('a late send response after sign-out cannot restore the conversation', async ({
  page,
}) => {
  await mockConversation(page);
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/api/auth/logout', (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.route(`**/api/conversations/${roomId}/messages`, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await held;
    await route.fulfill(failure(401));
  });
  const panel = await openRoom(page);
  await panel
    .getByRole('textbox', { name: 'Your reply', exact: true })
    .fill('Pending reply');
  await panel.getByRole('button', { name: 'Send reply' }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  const finished = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/messages'),
  );
  release();
  await finished;
  await expect(
    page.getByRole('heading', { name: 'Conversation with Sarah' }),
  ).toHaveCount(0);
  await expect(
    page.getByText('Your session has ended. Please sign in again.', {
      exact: true,
    }),
  ).toHaveCount(0);
});

test('a delayed own-status expiry never discards an open reply', async ({
  page,
}) => {
  await mockConversation(page);
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/api/users/me/social-battery', async (route) => {
    await held;
    await route.fulfill(failure(401));
  });
  const panel = await openRoom(page);
  await panel
    .getByRole('textbox', { name: 'Your reply', exact: true })
    .fill('My reply stays');
  const finished = page.waitForResponse((response) =>
    response.url().includes('/api/users/me/social-battery'),
  );
  release();
  await finished;
  await expect(
    page
      .getByRole('region', { name: 'Social Battery', exact: true })
      .getByRole('alert'),
  ).toContainText('Your session has ended');
  await expect(
    panel.getByRole('textbox', { name: 'Your reply', exact: true }),
  ).toHaveValue('My reply stays');
});

for (const availabilityExpires of [false, true]) {
  test(`first history load expiry stops loading with one notice; availability expiry=${availabilityExpires}`, async ({
    page,
  }) => {
    const state = await mockConversation(page);
    state.historyHandler = (route) => route.fulfill(failure(401));
    if (availabilityExpires) state.batteryFailure = failure(401);
    await page.goto('/');
    await page.getByRole('button', { name: 'Open conversation' }).click();
    const panel = page.getByRole('region', {
      name: 'Conversation with Sarah',
      exact: true,
    });
    await expect(panel.getByRole('alert')).toHaveCount(1);
    await expect(panel.getByRole('alert')).toContainText(
      'Your session has ended. Copy any unsent reply',
    );
    await expect(
      panel.getByText('Loading messages…', { exact: true }),
    ).toHaveCount(0);
    await expect(
      panel.getByText('Loading availability…', { exact: true }),
    ).toHaveCount(0);
    await expect(
      panel.getByText('No messages yet.', { exact: false }),
    ).toHaveCount(0);
    await expect(
      panel.getByRole('textbox', { name: 'Your unsent reply' }),
    ).toBeFocused();
    await expect(
      panel.getByRole('button', { name: 'Send reply' }),
    ).toBeDisabled();
    await expectAccessible(page);
    await panel.getByRole('button', { name: 'Sign in again' }).click();
    await expect(
      page.getByRole('heading', { name: 'Welcome back' }),
    ).toBeFocused();
  });
}

test('history refresh expiry stops loading and keeps the unsent reply', async ({
  page,
}) => {
  const state = await mockConversation(page);
  const panel = await openRoom(page);
  await expect(panel).toContainText('No messages yet.');
  await panel
    .getByRole('textbox', { name: 'Your reply', exact: true })
    .fill('Keep this draft');
  state.historyHandler = (route) => route.fulfill(failure(401));
  await panel.getByRole('button', { name: 'Refresh messages' }).click();
  await expect(
    panel.getByRole('textbox', { name: 'Your unsent reply' }),
  ).toHaveValue('Keep this draft');
  await expect(
    panel.getByRole('textbox', { name: 'Your unsent reply' }),
  ).toBeFocused();
  await expect(
    panel.getByText('Loading messages…', { exact: true }),
  ).toHaveCount(0);
  await expect(panel.getByRole('alert')).toHaveCount(1);
});
