import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Mock every /api request before opening the page. No backend or Atlas required;
// unexpected API calls fail explicitly rather than reaching the Vite API proxy.
async function mockApi(page, handler) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (handler && (await handler(route, path))) return;
    if (path === '/api/health')
      return route.fulfill({ json: { status: 'ok' } });
    if (path === '/api/auth/me')
      return route.fulfill({
        status: 401,
        json: { error: 'Sign in to continue.' },
      });
    throw new Error(
      `Unexpected API request: ${route.request().method()} ${path}`,
    );
  });
}

async function expectAccessible(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

async function openRegistration(page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'New here? Create an account' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Create your account' }),
  ).toBeVisible();
}

test('sign-in and registration expose labeled controls and pass axe scans', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await expect(
    page.getByText('Backend connected. The application foundation is ready.'),
  ).toBeVisible();
  await expectAccessible(page);
  await openRegistration(page);
  for (const rule of [
    'Contain at least 8 characters.',
    'Contain no more than 18 characters.',
    'Don’t use your email address.',
    'Contain no spaces.',
  ])
    await expect(page.getByText(rule, { exact: true })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
    'aria-describedby',
    'password-guidance',
  );
  await expectAccessible(page);
});

test('registration supports keyboard navigation and blocks invalid passwords', async ({
  page,
}) => {
  let writes = 0;
  await mockApi(page, async (route, path) => {
    if (path !== '/api/auth/register') return false;
    writes += 1;
    await route.fulfill({
      status: 500,
      json: { error: 'Unexpected submission' },
    });
    return true;
  });
  await openRegistration(page);
  const name = page.getByLabel('Display name', { exact: true });
  const email = page.getByLabel('Email address', { exact: true });
  const password = page.getByLabel('Password', { exact: true });
  await name.focus();
  await page.keyboard.press('Tab');
  await expect(email).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(password).toBeFocused();
  await expect(password).toHaveCSS('outline-style', 'solid');
  await name.fill('Browser Test');
  await email.fill('a@b.co');
  await password.pressSequentially('short');
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(password).toHaveJSProperty(
    'validationMessage',
    'This field must have at least 8 characters.',
  );
  await password.fill('abcd 1234');
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(page.getByRole('alert')).toHaveText(
    'Password must not contain spaces.',
  );
  await password.fill('xxA@B.COxx');
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(page.getByRole('alert')).toHaveText(
    'Password must not contain your email address.',
  );
  expect(writes).toBe(0);
});

test('mock sign-in reaches profile and sign-out returns to sign-in', async ({
  page,
}) => {
  const user = {
    id: '000000000000000000000001',
    displayName: 'Browser Test',
    email: 'test@example.com',
  };
  await mockApi(page, async (route, path) => {
    if (path === '/api/auth/login') {
      expect(route.request().postDataJSON()).toMatchObject({
        email: user.email,
        password: 'abcd1234',
      });
      await route.fulfill({ json: { user } });
      return true;
    }
    if (path === '/api/auth/logout') {
      await route.fulfill({ status: 204 });
      return true;
    }
    return false;
  });
  await page.goto('/');
  await page.getByLabel('Email address', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('abcd1234');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Hello, Browser Test' }),
  ).toBeVisible();
  await expectAccessible(page);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
});
