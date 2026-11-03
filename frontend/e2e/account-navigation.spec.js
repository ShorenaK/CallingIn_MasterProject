import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';
import {
  mockConversation,
  openRoom,
  message,
  roomId,
  user,
} from './conversation-helpers.js';

for (const link of ['Your account', 'Go to your account']) {
  test(`${link} closes an empty conversation and focuses the profile`, async ({
    page,
  }) => {
    await mockConversation(page);
    const panel = await openRoom(page);
    await page.getByRole('link', { name: link, exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Hello, Shorena' }),
    ).toBeFocused();
    await expect(panel).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Open conversation' }),
    ).toBeVisible();
    await expectAccessible(page);
  });

  test(`${link} protects a draft, Keep writing restores focus, and Discard goes to profile`, async ({
    page,
  }) => {
    await mockConversation(page);
    const panel = await openRoom(page);
    const input = panel.getByRole('textbox', {
      name: 'Your reply',
      exact: true,
    });
    await input.fill('Please preserve this reply');
    const accountLink = page.getByRole('link', { name: link, exact: true });
    await accountLink.click();
    await expect(
      panel.getByText('Discard this unsent reply and go to your account?', {
        exact: true,
      }),
    ).toBeFocused();
    await expect(input).toHaveValue('Please preserve this reply');
    await expectAccessible(page);
    await panel.getByRole('button', { name: 'Keep writing' }).click();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('Please preserve this reply');
    await accountLink.click();
    await panel
      .getByRole('button', { name: 'Discard and go to account' })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Hello, Shorena' }),
    ).toBeFocused();
    await expect(panel).toHaveCount(0);
    await page.getByRole('button', { name: 'Open conversation' }).click();
    await expect(input).toBeEmpty();
  });

  test(`${link} cannot leave while a message is being sent`, async ({
    page,
  }) => {
    await mockConversation(page);
    let release;
    const held = new Promise((resolve) => {
      release = resolve;
    });
    await page.route(
      `**/api/conversations/${roomId}/messages`,
      async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        await held;
        await route.fulfill({
          json: { message: message(40, 'Pending reply', user.id) },
        });
      },
    );
    try {
      const panel = await openRoom(page);
      const input = panel.getByRole('textbox', {
        name: 'Your reply',
        exact: true,
      });
      await input.fill('Pending reply');
      await panel.getByRole('button', { name: 'Send reply' }).click();
      await page.getByRole('link', { name: link, exact: true }).click();
      await expect(panel).toBeVisible();
      await expect(input).toHaveValue('Pending reply');
      await expect(
        panel.getByRole('button', { name: 'Sending…' }),
      ).toBeDisabled();
      await expect(
        panel.getByRole('button', { name: 'Discard and go to account' }),
      ).toHaveCount(0);
      release();
      await expect(input).toBeEmpty();
      await page.getByRole('link', { name: link, exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Hello, Shorena' }),
      ).toBeFocused();
    } finally {
      release();
    }
  });
}

test('account link focuses the profile when no conversation is open', async ({
  page,
}) => {
  await mockConversation(page);
  await page.goto('/');
  for (const link of ['Your account', 'Go to your account']) {
    await page.getByRole('link', { name: link, exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Hello, Shorena' }),
    ).toBeFocused();
  }
});

test('account navigation keeps a separate invitation draft mounted', async ({
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
    .fill('My separate invitation draft');
  await page.getByRole('button', { name: 'Open conversation' }).click();
  await expect(
    page.getByRole('heading', { name: 'Conversation with Sarah' }),
  ).toBeFocused();
  await page.getByRole('link', { name: 'Your account', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Hello, Shorena' }),
  ).toBeFocused();
  await expect(
    page.getByRole('textbox', { name: 'Your message', exact: true }),
  ).toHaveValue('My separate invitation draft');
});

test('account navigation protects whitespace and invisible-only drafts too', async ({
  page,
}) => {
  await mockConversation(page);
  const panel = await openRoom(page);
  await expect(panel).toContainText('No messages yet.');
  for (const text of ['  ', '\u200b']) {
    await panel
      .getByRole('textbox', { name: 'Your reply', exact: true })
      .fill(text);
    await page.getByRole('link', { name: 'Your account', exact: true }).click();
    await expect(
      panel.getByRole('button', { name: 'Discard and go to account' }),
    ).toBeVisible();
    await panel.getByRole('button', { name: 'Keep writing' }).click();
    await expect(
      panel.getByRole('textbox', { name: 'Your reply', exact: true }),
    ).toHaveValue(text);
  }
});

test('account navigation after expiry keeps a draft until explicit discard, then signs in', async ({
  page,
}) => {
  const state = await mockConversation(page);
  state.sendFailure = { status: 401, json: { error: 'Sign in to continue.' } };
  const panel = await openRoom(page);
  await panel
    .getByRole('textbox', { name: 'Your reply', exact: true })
    .fill('Copy before leaving');
  await panel.getByRole('button', { name: 'Send reply' }).click();
  const retained = panel.getByRole('textbox', { name: 'Your unsent reply' });
  await expect(retained).toHaveValue('Copy before leaving');
  await page.getByRole('link', { name: 'Your account', exact: true }).click();
  await panel.getByRole('button', { name: 'Keep writing' }).click();
  await expect(retained).toBeFocused();
  await expect(retained).toHaveValue('Copy before leaving');
  await page.getByRole('link', { name: 'Your account', exact: true }).click();
  await panel
    .getByRole('button', { name: 'Discard and go to account' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeFocused();
});
