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

/**
 * Serve a page per direction and record each list query. A function receives
 * the query parameters, so tests can answer differently for later pages.
 * `respond(id, body)` answers PATCH /api/invitations/:id/response.
 */
async function mockLists(page, pages, queries = [], respond) {
  await mockApi(
    page,
    async (route, path, url) => {
      const response = path.match(/^\/api\/invitations\/(\w+)\/response$/);
      if (response && respond && route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON();
        await route.fulfill(await respond(response[1], body));
        return true;
      }
      if (path !== '/api/invitations') return false;
      queries.push(Object.fromEntries(url.searchParams));
      const result = pages[url.searchParams.get('direction')];
      await route.fulfill(
        typeof result === 'function'
          ? result(url.searchParams)
          : { json: result },
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

test('malformed invitation date shows a retryable notice instead of breaking the page', async ({
  page,
}) => {
  let malformed = true;
  await mockLists(page, {
    incoming: () => ({
      json: {
        invitations: [invitation(malformed ? { createdAt: 'not-a-date' } : {})],
        nextCursor: null,
      },
    }),
    outgoing: empty,
  });
  await page.goto('/');
  const received = page.getByRole('region', { name: 'Received' });
  await expect(received.getByRole('alert')).toContainText(
    'The server returned an unexpected response.',
  );
  await expect(
    page.getByRole('heading', { name: 'Invitations', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Sent' })).toContainText(
    'You haven’t sent any invitations yet.',
  );
  malformed = false;
  await received.getByRole('button', { name: 'Try again' }).click();
  await expect(
    received.getByRole('article', { name: 'From Sarah' }),
  ).toBeVisible();
  await expect(received.getByRole('alert')).toHaveCount(0);
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

const cursor = '2026-10-29T10:00:00.000Z~000000000000000000000c10';

function people(from, count) {
  return Array.from({ length: count }, (_, index) => {
    const number = from + index;
    return invitation({
      id: String(number).padStart(24, '0'),
      otherPerson: { displayName: `Person ${number}` },
    });
  });
}

function firstPageThen(laterPage) {
  return (params) =>
    params.get('cursor')
      ? laterPage()
      : { json: { invitations: people(1, 10), nextCursor: cursor } };
}

test('show more appends the next page, moves focus, and announces it', async ({
  page,
}) => {
  const queries = [];
  await mockLists(
    page,
    {
      incoming: firstPageThen(() => ({
        json: { invitations: people(11, 3), nextCursor: null },
      })),
      outgoing: empty,
    },
    queries,
  );
  await page.goto('/');
  const received = page.getByRole('region', { name: 'Received' });
  await expect(received.getByRole('article')).toHaveCount(10);
  await expectAccessible(page);
  await received.getByRole('button', { name: 'Show more received' }).click();
  await expect(received.getByRole('article')).toHaveCount(13);
  await expect(
    received.getByRole('heading', { name: 'From Person 11' }),
  ).toBeFocused();
  await expect(
    received
      .getByRole('status')
      .filter({ hasText: 'Loaded 3 more invitations.' }),
  ).toBeAttached();
  await expect(
    received.getByRole('button', { name: 'Show more received' }),
  ).toHaveCount(0);
  expect(queries).toContainEqual({
    direction: 'incoming',
    limit: '10',
    cursor,
  });
  await expectAccessible(page);
});

test('show more failure keeps loaded invitations and can be retried', async ({
  page,
}) => {
  let fail = true;
  await mockLists(page, {
    incoming: firstPageThen(() =>
      fail
        ? {
            status: 503,
            json: { error: 'Invitation lists are temporarily unavailable.' },
          }
        : { json: { invitations: people(11, 1), nextCursor: null } },
    ),
    outgoing: empty,
  });
  await page.goto('/');
  const received = page.getByRole('region', { name: 'Received' });
  await received.getByRole('button', { name: 'Show more received' }).click();
  await expect(received.getByRole('alert')).toContainText(
    'Invitation lists are temporarily unavailable.',
  );
  await expect(received.getByRole('article')).toHaveCount(10);
  await expectAccessible(page);
  fail = false;
  await received.getByRole('button', { name: 'Try again' }).click();
  await expect(received.getByRole('article')).toHaveCount(11);
  await expect(
    received
      .getByRole('status')
      .filter({ hasText: 'Loaded 1 more invitation.' }),
  ).toBeAttached();
  await expect(received.getByRole('alert')).toHaveCount(0);
});

test('session expiry during show more returns to sign-in', async ({ page }) => {
  await mockLists(page, {
    incoming: firstPageThen(() => ({
      status: 401,
      json: { error: 'Sign in to continue.' },
    })),
    outgoing: empty,
  });
  await page.goto('/');
  await page
    .getByRole('region', { name: 'Received' })
    .getByRole('button', { name: 'Show more received' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeFocused();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Your session has ended. Please sign in again.' }),
  ).toBeVisible();
});

const sarahId = '0000000000000000000000a1';

/** The server's response payload has no counterpart name. */
function answer(status) {
  const updated = invitation({
    status,
    updatedAt: '2026-10-30T14:00:00.000Z',
    respondedAt: '2026-10-30T14:00:00.000Z',
  });
  delete updated.otherPerson;
  return { json: { invitation: updated } };
}

async function openReceived(page, received, requests, respond) {
  await mockLists(
    page,
    {
      incoming: { invitations: received, nextCursor: null },
      outgoing: empty,
    },
    [],
    respond ??
      ((id, body) => {
        requests.push({ id, body });
        return answer(body.status);
      }),
  );
  await page.goto('/');
  return page.getByRole('article', { name: 'From Sarah' });
}

test('Maybe Later saves immediately and keeps the final choices open', async ({
  page,
}) => {
  const requests = [];
  const card = await openReceived(page, [invitation()], requests);
  await expectAccessible(page);
  await card.getByRole('button', { name: 'Maybe Later' }).click();
  const status = card.locator('.status-label');
  await expect(status).toHaveText(/You chose Maybe Later/);
  await expect(status).toBeFocused();
  expect(requests).toEqual([{ id: sarahId, body: { status: 'deferred' } }]);
  await expect(card.getByRole('button', { name: 'Maybe Later' })).toHaveCount(
    0,
  );
  await expect(card.getByRole('button', { name: 'Accept' })).toBeVisible();
  await expect(
    card.getByRole('button', { name: 'I need some space' }),
  ).toBeVisible();
});

test('Accept asks once, Go back saves nothing, and confirming is final', async ({
  page,
}) => {
  const requests = [];
  const card = await openReceived(page, [invitation()], requests);
  await card.getByRole('button', { name: 'Accept' }).click();
  await expect(
    card.getByText('Accept this invitation? This is final'),
  ).toBeFocused();
  await expectAccessible(page);
  await card.getByRole('button', { name: 'Go back' }).click();
  await expect(card.getByRole('button', { name: 'Accept' })).toBeFocused();
  expect(requests).toEqual([]);
  await card.getByRole('button', { name: 'Accept' }).click();
  await card.getByRole('button', { name: 'Yes, accept' }).click();
  const status = card.locator('.status-label');
  await expect(status).toHaveText(/You accepted/);
  await expect(status).toBeFocused();
  await expect(card.getByRole('button')).toHaveCount(0);
  await expect(card).toContainText(
    'Private conversations are coming in a future update.',
  );
  expect(requests).toEqual([{ id: sarahId, body: { status: 'accepted' } }]);
});

test('I need some space confirms from Maybe Later and closes the invitation', async ({
  page,
}) => {
  const requests = [];
  const card = await openReceived(
    page,
    [invitation({ status: 'deferred' })],
    requests,
  );
  await expect(card.getByRole('button')).toHaveText([
    'Accept',
    'I need some space',
  ]);
  await card.getByRole('button', { name: 'I need some space' }).click();
  await expect(
    card.getByText('Choose I need some space? This closes the invitation'),
  ).toBeFocused();
  await card.getByRole('button', { name: 'Yes, I need some space' }).click();
  await expect(card.locator('.status-label')).toHaveText(
    /You chose I need some space/,
  );
  await expect(card.getByRole('button')).toHaveCount(0);
  expect(requests).toEqual([{ id: sarahId, body: { status: 'declined' } }]);
  await expectAccessible(page);
});

test('sent invitations never offer response buttons', async ({ page }) => {
  await mockLists(page, {
    incoming: empty,
    outgoing: {
      invitations: [invitation({ otherPerson: { displayName: 'Michael' } })],
      nextCursor: null,
    },
  });
  await page.goto('/');
  const card = page.getByRole('article', { name: 'To Michael' });
  await expect(card).toContainText('Waiting for a reply');
  await expect(card.getByRole('button')).toHaveCount(0);
});

test('an already-final invitation explains itself and offers a refresh', async ({
  page,
}) => {
  let refreshed = false;
  await mockLists(
    page,
    {
      incoming: () => ({
        json: {
          invitations: [
            invitation({ status: refreshed ? 'accepted' : 'pending' }),
          ],
          nextCursor: null,
        },
      }),
      outgoing: empty,
    },
    [],
    () => ({
      status: 409,
      json: { error: 'This invitation already has a final response.' },
    }),
  );
  await page.goto('/');
  const card = page.getByRole('article', { name: 'From Sarah' });
  await card.getByRole('button', { name: 'Accept' }).click();
  await card.getByRole('button', { name: 'Yes, accept' }).click();
  await expect(card.getByRole('alert')).toContainText(
    'This invitation already has a final response.',
  );
  await expectAccessible(page);
  refreshed = true;
  await card.getByRole('button', { name: 'Refresh list' }).click();
  await expect(
    page.getByRole('article', { name: 'From Sarah' }).locator('.status-label'),
  ).toHaveText(/You accepted/);
});

test('session expiry while responding returns to sign-in', async ({ page }) => {
  const card = await openReceived(page, [invitation()], [], () => ({
    status: 401,
    json: { error: 'Sign in to continue.' },
  }));
  await card.getByRole('button', { name: 'Maybe Later' }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeFocused();
});
