import { test, expect } from '@playwright/test';
import { mockApi, expectAccessible } from './helpers.js';

const user = {
  id: '000000000000000000000001',
  displayName: 'Test',
  email: 'test@example.com',
};
const other = { id: '000000000000000000000002', displayName: 'Sarah' };
const old = {
  id: '0000000000000000000000a1',
  message: 'Old invitation kept as history',
  status: 'declined',
  createdAt: '2026-10-01T12:00:00.000Z',
  otherPerson: other,
};
const notice =
  'They need some space. You can send another invitation 30 days after they decline.';

async function setup(page, options = {}) {
  const sent = [];
  let created = null;
  await mockApi(
    page,
    async (route, path, url) => {
      if (path === '/api/users/lookup') {
        await route.fulfill({ json: { user: other } });
        return true;
      }
      if (path !== '/api/invitations') return false;
      if (route.request().method() === 'POST') {
        sent.push(route.request().postDataJSON());
        if (options.conflict)
          await route.fulfill({
            status: 409,
            json: {
              error: 'Synthetic invitation conflict',
              code: options.conflict,
            },
          });
        else {
          created = {
            ...old,
            id: '0000000000000000000000a2',
            status: 'pending',
            message: sent.at(-1).message,
            createdAt: '2026-11-04T12:00:00.000Z',
          };
          await route.fulfill({ status: 201, json: { invitation: created } });
        }
      } else {
        const records = [
          {
            ...old,
            ...(options.enabled && !created
              ? { resendPolicy: 'decline-30-days' }
              : {}),
          },
        ];
        if (created) records.unshift(created);
        await route.fulfill({
          json: {
            invitations:
              url.searchParams.get('direction') === 'outgoing' ? records : [],
            nextCursor: null,
          },
        });
      }
      return true;
    },
    { user },
  );
  await page.goto('/');
  return {
    sent,
    panel: page.getByRole('region', { name: 'Send an invitation' }),
  };
}

test('current decline shows simple 30-day notice only with server policy enabled', async ({
  page,
}) => {
  await setup(page, { enabled: true });
  await expect(page.getByText(notice, { exact: true })).toBeVisible();
  await expectAccessible(page);
});

test('legacy policy does not promise that another invitation is allowed', async ({
  page,
}) => {
  await setup(page);
  await expect(page.getByText(notice, { exact: true })).toHaveCount(0);
  await expect(page.getByText('Closed — they need some space')).toBeVisible();
});

for (const code of ['INVITATION_COOLDOWN', 'INVITATION_ACTIVE']) {
  test(`${code} explains why sending is blocked and keeps the draft`, async ({
    page,
  }) => {
    const f = await setup(page, { enabled: true, conflict: code });
    await f.panel
      .getByLabel('Their email address', { exact: true })
      .fill('sarah@example.com');
    await f.panel.getByRole('button', { name: 'Find person' }).click();
    const draft = f.panel.getByRole('textbox', {
      name: 'Your message',
      exact: true,
    });
    await draft.fill('A new invitation');
    await f.panel.getByRole('button', { name: 'Send invitation' }).click();
    await expect(f.panel.getByRole('alert')).toContainText(
      code === 'INVITATION_COOLDOWN'
        ? 'Please wait 30 days after their decline'
        : 'open or accepted invitation',
    );
    await expect(draft).toHaveValue('A new invitation');
    expect(f.sent).toHaveLength(1);
  });
}

test('allowed re-invitation creates a new card and preserves the declined history', async ({
  page,
}) => {
  const f = await setup(page, { enabled: true });
  expect(f.sent).toHaveLength(0);
  await f.panel
    .getByLabel('Their email address', { exact: true })
    .fill('sarah@example.com');
  await f.panel.getByRole('button', { name: 'Find person' }).click();
  await f.panel
    .getByRole('textbox', { name: 'Your message', exact: true })
    .fill('A new invitation');
  await f.panel.getByRole('button', { name: 'Send invitation' }).click();
  const sent = page.getByRole('region', { name: 'Sent', exact: true });
  await expect(sent.getByRole('article')).toHaveCount(2);
  await expect(sent.getByText('Old invitation kept as history')).toBeVisible();
  await expect(
    sent.getByText('A new invitation', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(notice, { exact: true })).toHaveCount(0);
  expect(f.sent).toEqual([
    { recipientId: other.id, message: 'A new invitation' },
  ]);
});
