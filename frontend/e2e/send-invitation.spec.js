import { test, expect } from '@playwright/test';
import { mockApi, expectAccessible } from './helpers.js';

// Public test data only; every API response below is simulated.
const user = {
  id: '000000000000000000000001',
  displayName: 'Browser Test',
  email: 'test@example.com',
};
const sarah = { id: '000000000000000000000002', displayName: 'Sarah' };
const empty = { invitations: [], nextCursor: null };

function created(message) {
  return {
    id: '0000000000000000000000c1',
    senderId: user.id,
    recipientId: sarah.id,
    message: message.trim(),
    status: 'pending',
    createdAt: '2026-10-30T15:00:00.000Z',
    updatedAt: '2026-10-30T15:00:00.000Z',
    respondedAt: null,
  };
}

/**
 * Lists start empty; `lookup` and `create` answer the two POST routes and
 * every request body is recorded so tests can check exactly what was sent.
 */
async function mockSending(page, { lookup, create, sent = () => empty }) {
  const requests = [];
  await mockApi(
    page,
    async (route, path, url) => {
      const method = route.request().method();
      if (path === '/api/invitations' && method === 'GET') {
        const direction = url.searchParams.get('direction');
        await route.fulfill({
          json: direction === 'outgoing' ? sent() : empty,
        });
        return true;
      }
      const handler =
        path === '/api/users/lookup'
          ? lookup
          : path === '/api/invitations'
            ? create
            : null;
      if (!handler) return false;
      const body = route.request().postDataJSON();
      requests.push({ path, body });
      await route.fulfill(await handler(body));
      return true;
    },
    { user },
  );
  await page.goto('/');
  return requests;
}

const found = () => ({ json: { user: sarah } });

async function findSarah(page) {
  const panel = page.getByRole('region', { name: 'Send an invitation' });
  await panel
    .getByLabel('Their email address', { exact: true })
    .fill(' Sarah@Example.com ');
  await panel.getByRole('button', { name: 'Find person' }).click();
  return panel;
}

test('find a person, write a message, and send an invitation', async ({
  page,
}) => {
  let sentOnce = false;
  const requests = await mockSending(page, {
    lookup: found,
    create: (body) => {
      sentOnce = true;
      return { status: 201, json: { invitation: created(body.message) } };
    },
    sent: () =>
      sentOnce
        ? {
            invitations: [
              {
                ...created('Hello Sarah'),
                otherPerson: { displayName: 'Sarah' },
              },
            ],
            nextCursor: null,
          }
        : empty,
  });
  await expectAccessible(page);
  const panel = await findSarah(page);
  await expect(panel.getByText('Sending to Sarah')).toBeFocused();
  const message = panel.getByRole('textbox', { name: 'Your message' });
  await message.fill('Hello Sarah');
  await expect(panel.locator('#message-count')).toHaveText(
    '11 of 5,000 characters',
  );
  await expectAccessible(page);
  await panel.getByRole('button', { name: 'Send invitation' }).click();
  await expect(
    panel.getByRole('status').filter({ hasText: 'Invitation sent to Sarah.' }),
  ).toBeFocused();
  expect(requests).toEqual([
    { path: '/api/users/lookup', body: { email: 'Sarah@Example.com' } },
    {
      path: '/api/invitations',
      body: { recipientId: sarah.id, message: 'Hello Sarah' },
    },
  ]);
  await expect(
    page
      .getByRole('region', { name: 'Sent' })
      .getByRole('article', { name: 'To Sarah' }),
  ).toContainText('Waiting for a reply');
  await expect(
    panel.getByLabel('Their email address', { exact: true }),
  ).toHaveValue('');
  await expectAccessible(page);
});

test('lookup explains missing accounts and rate limits', async ({ page }) => {
  let attempt = 0;
  await mockSending(page, {
    lookup: () =>
      ++attempt === 1
        ? { status: 404, json: { error: 'No matching recipient found.' } }
        : {
            status: 429,
            json: {
              error: 'Too many recipient lookups. Please try again later.',
            },
          },
  });
  const panel = await findSarah(page);
  await expect(panel.getByRole('alert')).toContainText(
    'No account matches that email. Check the spelling',
  );
  await expectAccessible(page);
  await panel.getByRole('button', { name: 'Find person' }).click();
  await expect(panel.getByRole('alert')).toContainText(
    'Too many recipient lookups. Please try again later.',
  );
  await expect(
    panel.getByLabel('Their email address', { exact: true }),
  ).toHaveValue('Sarah@Example.com');
});

test('counter matches the 5,000 limit, never truncates, and blocks overlong sends', async ({
  page,
}) => {
  const requests = await mockSending(page, {
    lookup: found,
    create: () => ({ status: 500, json: { error: 'Unexpected submission' } }),
  });
  const panel = await findSarah(page);
  const message = panel.getByRole('textbox', { name: 'Your message' });
  const count = panel.locator('#message-count');
  // Emoji are two JavaScript code units, matching the server's measurement.
  await message.fill('😊'.repeat(2500));
  await expect(count).toHaveText('5,000 of 5,000 characters');
  await expect(
    panel
      .getByRole('status')
      .filter({ hasText: '100 or fewer characters left.' }),
  ).toBeAttached();
  await message.focus();
  await page.keyboard.insertText('x');
  await expect(message).toHaveValue(`${'😊'.repeat(2500)}x`);
  await expect(count).toContainText('1 character over the limit');
  await expect(message).toHaveAttribute('aria-invalid', 'true');
  await expectAccessible(page);
  await panel.getByRole('button', { name: 'Send invitation' }).click();
  await expect(panel.getByRole('alert')).toContainText(
    'Shorten your message to 5,000 characters or fewer.',
  );
  await message.fill('   ');
  await panel.getByRole('button', { name: 'Send invitation' }).click();
  await expect(panel.getByRole('alert')).toContainText(
    'Write a message before sending.',
  );
  expect(requests.filter((item) => item.path === '/api/invitations')).toEqual(
    [],
  );
});

test('an existing invitation between the pair is explained and the draft kept', async ({
  page,
}) => {
  await mockSending(page, {
    lookup: found,
    create: () => ({
      status: 409,
      json: { error: 'An invitation already exists between these accounts.' },
    }),
  });
  const panel = await findSarah(page);
  const message = panel.getByRole('textbox', { name: 'Your message' });
  await message.fill('Hello again');
  await panel.getByRole('button', { name: 'Send invitation' }).click();
  await expect(panel.getByRole('alert')).toContainText(
    'You and Sarah already have an invitation. Only one is allowed between two accounts.',
  );
  await expect(message).toHaveValue('Hello again');
});

test('expired session while sending keeps the draft until the person signs in again', async ({
  page,
}) => {
  await mockSending(page, {
    lookup: found,
    create: () => ({ status: 401, json: { error: 'Sign in to continue.' } }),
  });
  const panel = await findSarah(page);
  const message = panel.getByRole('textbox', { name: 'Your message' });
  await message.fill('Words I want to keep');
  await panel.getByRole('button', { name: 'Send invitation' }).click();
  await expect(panel.getByRole('alert')).toContainText(
    'Your session has ended. Copy your message',
  );
  await expect(message).toHaveValue('Words I want to keep');
  await expectAccessible(page);
  await panel.getByRole('button', { name: 'Sign in again' }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeFocused();
});

test('Change person returns to the email field with the address kept', async ({
  page,
}) => {
  await mockSending(page, { lookup: found });
  const panel = await findSarah(page);
  await panel.getByRole('button', { name: 'Change person' }).click();
  const email = panel.getByLabel('Their email address', { exact: true });
  await expect(email).toBeFocused();
  await expect(email).toHaveValue('Sarah@Example.com');
});
