import { test, expect } from '@playwright/test';
import { mockApi, expectAccessible } from './helpers.js';

const user = {
  id: '000000000000000000000001',
  displayName: 'Shorena',
  email: 'shorena@example.com',
};
const empty = { invitations: [], nextCursor: null };

async function setup(page, options = {}) {
  const state = {
    status: options.status ?? null,
    writes: [],
    failure: null,
    loadFailure: options.loadFailure,
    malformed: false,
  };
  await mockApi(
    page,
    async (route, path) => {
      if (path === '/api/invitations') {
        await route.fulfill({ json: empty });
        return true;
      }
      if (path !== '/api/users/me/social-battery') return false;
      if (route.request().method() === 'PATCH') {
        state.writes.push(route.request().postDataJSON());
        if (state.failure) await route.fulfill(state.failure);
        else {
          state.status = route.request().postDataJSON().status;
          await route.fulfill({
            json: state.malformed
              ? { status: 'unknown' }
              : { status: state.status },
          });
        }
      } else
        await route.fulfill(
          state.loadFailure ?? { json: { status: state.status } },
        );
      return true;
    },
    { user },
  );
  await page.goto('/');
  const panel = page.getByRole('region', {
    name: 'Social Battery',
    exact: true,
  });
  return { state, panel };
}

test('starts unset, selects by keyboard, saves only explicitly and survives reload', async ({
  page,
}) => {
  const { state, panel } = await setup(page);
  await expect(panel).toContainText('Saved status: Not set');
  await expect(
    panel.getByRole('button', { name: 'Save Status' }),
  ).toBeDisabled();
  const open = panel.getByRole('radio', { name: /Open to Conversations/ });
  await open.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await expect(panel.getByRole('radio', { name: /Busy/ })).toBeChecked();
  expect(state.writes).toEqual([]);
  await page.keyboard.press('Tab');
  await expect(
    panel.getByRole('button', { name: 'Save Status' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(panel).toContainText('Saved status: Busy');
  await expect(
    panel.getByRole('status').filter({ hasText: 'has been saved' }),
  ).toBeVisible();
  expect(state.writes).toEqual([{ status: 'busy' }]);
  await page.reload();
  await expect(panel.getByRole('radio', { name: /Busy/ })).toBeChecked();
  await expectAccessible(page);
});

test('all three choices save and low battery leaves invitation controls available', async ({
  page,
}) => {
  const { state, panel } = await setup(page);
  for (const [label, value] of [
    ['Open to Conversations', 'open'],
    ['Busy', 'busy'],
    ['Taking Personal Space', 'space'],
  ]) {
    await panel.getByRole('radio', { name: new RegExp(label) }).check();
    await panel.getByRole('button', { name: 'Save Status' }).click();
    await expect(panel).toContainText(`Saved status: ${label}`);
    expect(state.status).toBe(value);
    await expectAccessible(page);
  }
  await expect(page.getByRole('button', { name: 'Find person' })).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    panel.getByRole('radio', { name: /Taking Personal Space/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        globalThis.document.documentElement.scrollWidth <=
        globalThis.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: '/tmp/callingin-social-battery-phone.png',
    fullPage: true,
  });
});

test('failed save retains the choice and distinguishes it from the saved status', async ({
  page,
}) => {
  const { state, panel } = await setup(page, { status: 'open' });
  state.failure = {
    status: 503,
    json: { error: 'Social Battery is temporarily unavailable.' },
  };
  await panel.getByRole('radio', { name: /Taking Personal Space/ }).check();
  await panel.getByRole('button', { name: 'Save Status' }).click();
  await expect(panel.getByRole('alert')).toContainText(
    'temporarily unavailable',
  );
  await expect(panel).toContainText('Saved status: Open to Conversations');
  await expect(
    panel.getByRole('radio', { name: /Taking Personal Space/ }),
  ).toBeChecked();
  state.failure = null;
  await panel.getByRole('button', { name: 'Save Status' }).click();
  await expect(panel).toContainText('Saved status: Taking Personal Space');
});

test('initial read failure can reload without overwriting storage', async ({
  page,
}) => {
  const { state, panel } = await setup(page, {
    status: 'busy',
    loadFailure: { status: 503, json: { error: 'Unavailable' } },
  });
  await expect(
    panel.getByRole('button', { name: 'Save Status' }),
  ).toBeDisabled();
  state.loadFailure = null;
  await panel.getByRole('button', { name: 'Reload saved status' }).click();
  await expect(panel).toContainText('Saved status: Busy');
  expect(state.writes).toEqual([]);
});

test('malformed saved response is not announced as a successful save', async ({
  page,
}) => {
  const { state, panel } = await setup(page);
  state.malformed = true;
  await panel.getByRole('radio', { name: /Busy/ }).check();
  await panel.getByRole('button', { name: 'Save Status' }).click();
  await expect(panel.getByRole('alert')).toContainText(
    'unexpected Social Battery response',
  );
  await expect(panel).toContainText('Saved status: Not set');
});

test('expired status save keeps the page until explicit sign-in', async ({
  page,
}) => {
  const { state, panel } = await setup(page);
  state.failure = { status: 401, json: { error: 'Sign in to continue.' } };
  await panel.getByRole('radio', { name: /Busy/ }).check();
  await panel.getByRole('button', { name: 'Save Status' }).click();
  await expect(panel.getByRole('alert')).toContainText(
    'Your session has ended',
  );
  await expect(panel.getByRole('radio', { name: /Busy/ })).toBeChecked();
  await expect(
    panel.getByRole('button', { name: 'Save Status' }),
  ).toBeDisabled();
  await panel.getByRole('button', { name: 'Sign in again' }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeFocused();
});
