import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Mock every /api request before opening the page. No backend or Atlas required;
// unexpected API calls fail explicitly rather than reaching the Vite API proxy.
// Pass `user` to start signed in; otherwise the session check returns 401.
export async function mockApi(page, handler, { user } = {}) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (handler && (await handler(route, path, url))) return;
    if (path === '/api/health')
      return route.fulfill({ json: { status: 'ok' } });
    if (path === '/api/auth/me')
      return user
        ? route.fulfill({ json: { user } })
        : route.fulfill({
            status: 401,
            json: { error: 'Sign in to continue.' },
          });
    throw new Error(
      `Unexpected API request: ${route.request().method()} ${path}`,
    );
  });
}

export async function expectAccessible(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}
