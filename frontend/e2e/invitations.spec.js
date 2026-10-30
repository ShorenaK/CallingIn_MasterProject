import { test, expect } from '@playwright/test';
import { mockApi, expectAccessible } from './helpers.js';

// Public test data only; every API response below is simulated.
const user = {
  id: '000000000000000000000001',
  displayName: 'Browser Test',
  email: 'test@example.com',
};

function invitation(overrides) {
  return {
    id: '0000000000000000000000a1',
    senderId: '000000000000000000000002',
    recipientId: user.id,
    message: 'Hello',
    status: 'pending',
    createdAt: '2026-10-30T13:14:00.000Z',
    updatedAt: '2026-10-30T13:14:00.000Z',
    respondedAt: null,
    otherPerson: { displayName: 'Sarah' },
    ...overrides,
  };
}

/** Serve one fixed page per direction and record each list query. */
async function mockLists(page, pages, queries = []) {
  await mockApi(
    page,
    async (route, path, url) => {
      if (path !== '/api/invitations') return false;
      queries.push(Object.fromEntries(url.searchParams));
      const result = pages[url.searchParams.get('direction')];
      await route.fulfill(
        typeof result === 'function' ? result() : { json: result },
      );
      return true;
    },
    { user },
  );
}

const empty = { invitations: [], nextCursor: null };

test('signed-in view shows empty invitation lists accessibly', async ({
  page,
}) => {
  const queries = [];
  await mockLists(page, { incoming: empty, outgoing: empty }, queries);
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Invitations', exact: true }),
  ).toBeVisible();
  const received = page.getByRole('region', { name: 'Received' });
  const sent = page.getByRole('region', { name: 'Sent' });
  await expect(received).toContainText(
    'No invitations yet. When someone invites you, it will appear here.',
  );
  await expect(sent).toContainText('You haven’t sent any invitations yet.');
  expect(queries).toEqual(
    expect.arrayContaining([
      { direction: 'incoming', limit: '10' },
      { direction: 'outgoing', limit: '10' },
    ]),
  );
  await expectAccessible(page);
});

test('invitation cards show names, text status labels, and messages', async ({
  page,
}) => {
  await mockLists(page, {
    incoming: {
      invitations: [
        invitation({
          message: 'I’m here if you’d like to talk.\nNo pressure.',
        }),
        invitation({
          id: '0000000000000000000000a2',
          status: 'accepted',
          otherPerson: null,
        }),
      ],
      nextCursor: null,
    },
    outgoing: {
      invitations: [
        invitation({
          id: '0000000000000000000000b1',
          status: 'declined',
          otherPerson: { displayName: 'Michael' },
        }),
        invitation({
          id: '0000000000000000000000b2',
          status: 'deferred',
          otherPerson: { displayName: 'Emma' },
        }),
      ],
      nextCursor: null,
    },
  });
  await page.goto('/');
  const received = page.getByRole('region', { name: 'Received' });
  const sent = page.getByRole('region', { name: 'Sent' });
  const fromSarah = received.getByRole('article', { name: 'From Sarah' });
  await expect(fromSarah).toContainText('Waiting for your reply');
  await expect(fromSarah.locator('.invitation-message')).toHaveText(
    'I’m here if you’d like to talk.\nNo pressure.',
  );
  await expect(fromSarah.locator('time')).toHaveAttribute(
    'datetime',
    '2026-10-30T13:14:00.000Z',
  );
  const unavailable = received.getByRole('article', {
    name: 'Account unavailable',
  });
  await expect(unavailable).toContainText('You accepted');
  await expect(unavailable).toContainText(
    'Private conversations are coming in a future update.',
  );
  await expect(sent.getByRole('article', { name: 'To Michael' })).toContainText(
    'Closed — they need some space',
  );
  await expect(sent.getByRole('article', { name: 'To Emma' })).toContainText(
    'They chose Maybe Later',
  );
  await expectAccessible(page);
});

test('list failure shows a calm retryable problem notice', async ({ page }) => {
  let failIncoming = true;
  await mockLists(page, {
    incoming: () =>
      failIncoming
        ? {
            status: 503,
            json: { error: 'Invitation lists are temporarily unavailable.' },
          }
        : { json: empty },
    outgoing: empty,
  });
  await page.goto('/');
  const received = page.getByRole('region', { name: 'Received' });
  await expect(received.getByRole('alert')).toContainText(
    'Invitation lists are temporarily unavailable.',
  );
  await expectAccessible(page);
  failIncoming = false;
  await received.getByRole('button', { name: 'Try again' }).click();
  await expect(received).toContainText('No invitations yet.');
  await expect(received.getByRole('alert')).toHaveCount(0);
});

test('unexpected list data is not displayed', async ({ page }) => {
  await mockLists(page, {
    incoming: { invitations: [{ id: 1 }], nextCursor: null },
    outgoing: empty,
  });
  await page.goto('/');
  await expect(
    page.getByRole('region', { name: 'Received' }).getByRole('alert'),
  ).toContainText('The server returned an unexpected response.');
});

test('expired session returns to sign-in with a focused explanation', async ({
  page,
}) => {
  const expired = () => ({
    status: 401,
    json: { error: 'Sign in to continue.' },
  });
  await mockLists(page, { incoming: expired, outgoing: expired });
  await page.goto('/');
  const heading = page.getByRole('heading', { name: 'Welcome back' });
  await expect(heading).toBeFocused();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Your session has ended. Please sign in again.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Invitations', exact: true }),
  ).toHaveCount(0);
  await expectAccessible(page);
});
