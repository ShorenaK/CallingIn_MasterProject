import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';
import {
  mockConversation,
  openRoom,
  message,
  user,
} from './conversation-helpers.js';

for (const direction of ['incoming', 'outgoing']) {
  test(`opens from ${direction}, reads and sends while partner takes space`, async ({
    page,
  }) => {
    const state = await mockConversation(page, {
      direction,
      messages: [message(2), message(1)],
    });
    const panel = await openRoom(page, direction);
    await expect(
      panel
        .getByRole('list', { name: 'Message history' })
        .locator('li .invitation-message'),
    ).toHaveText(['Message 1', 'Message 2']);
    await expect(
      panel.getByRole('region', { name: 'Sarah’s Social Battery' }),
    ).toContainText('Taking Personal Space');
    await panel
      .getByRole('textbox', { name: 'Your reply', exact: true })
      .fill('  Hello Sarah  ');
    await panel.getByRole('button', { name: 'Send reply' }).click();
    await expect(panel.getByRole('list')).toContainText('Hello Sarah');
    await expect(
      panel.getByRole('textbox', { name: 'Your reply', exact: true }),
    ).toBeEmpty();
    await expect(
      panel.getByRole('textbox', { name: 'Your reply', exact: true }),
    ).toBeFocused();
    expect(state.sends).toEqual([{ text: '  Hello Sarah  ' }]);
    await expectAccessible(page);
    await panel.getByRole('button', { name: 'Back to invitations' }).click();
    await expect(
      page.getByRole('button', { name: 'Open conversation' }),
    ).toBeFocused();
  });
}

test('empty history, whitespace, UTF-16 boundaries and multiline replies', async ({
  page,
}) => {
  const state = await mockConversation(page);
  const panel = await openRoom(page);
  await expect(panel).toContainText('No messages yet.');
  const input = panel.getByRole('textbox', { name: 'Your reply', exact: true });
  const send = panel.getByRole('button', { name: 'Send reply' });
  await input.fill('   ');
  await expect(send).toBeDisabled();
  await input.fill('😀'.repeat(2500) + 'x');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(send).toBeDisabled();
  await input.fill('😀'.repeat(2500));
  await expect(send).toBeEnabled();
  await send.click();
  await expect(input).toBeEmpty();
  expect(state.sends[0].text.length).toBe(5000);
  await input.fill('First line');
  await input.press('Enter');
  await input.pressSequentially('Second line');
  expect(state.sends).toHaveLength(1);
  await send.click();
  await expect(input).toBeEmpty();
  expect(state.sends[1].text).toBe('First line\nSecond line');
});

for (const status of [429, 503]) {
  test(`send ${status} retains draft; refresh checks history before retry`, async ({
    page,
  }) => {
    const state = await mockConversation(page);
    state.sendFailure = {
      status,
      json: {
        error:
          status === 429
            ? 'Please wait before sending again.'
            : 'Messages are temporarily unavailable.',
      },
    };
    const panel = await openRoom(page);
    const input = panel.getByRole('textbox', {
      name: 'Your reply',
      exact: true,
    });
    await input.fill('Keep this reply');
    await panel.getByRole('button', { name: 'Send reply' }).click();
    await expect(panel.getByRole('alert')).toContainText(
      'Refresh messages to check whether it arrived',
    );
    await expect(input).toHaveValue('Keep this reply');
    await expect(input).toBeFocused();
    state.sendFailure = null;
    await panel.getByRole('button', { name: 'Refresh messages' }).click();
    await expect(input).toBeEditable();
    await panel.getByRole('button', { name: 'Send reply' }).click();
    await expect(input).toBeEmpty();
    await expect(panel.getByRole('list')).toContainText('Keep this reply');
  });
}

test('session expiry retains a focused read-only reply until explicit sign-in', async ({
  page,
}) => {
  const state = await mockConversation(page);
  state.sendFailure = { status: 401, json: { error: 'Sign in to continue.' } };
  const panel = await openRoom(page);
  const input = panel.getByRole('textbox', { name: 'Your reply', exact: true });
  await input.fill('Copy me before signing in');
  await panel.getByRole('button', { name: 'Send reply' }).click();
  const retained = panel.getByRole('textbox', { name: 'Your unsent reply' });
  await expect(retained).toHaveValue('Copy me before signing in');
  await expect(retained).toHaveAttribute('readonly', '');
  await expect(retained).toBeFocused();
  await expect(
    panel.getByRole('button', { name: 'Send reply' }),
  ).toBeDisabled();
  await expectAccessible(page);
  await panel.getByRole('button', { name: 'Sign in again' }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeFocused();
});

test('keep/discard confirmation preserves reply and returns focus', async ({
  page,
}) => {
  await mockConversation(page);
  const panel = await openRoom(page);
  await panel
    .getByRole('textbox', { name: 'Your reply', exact: true })
    .fill('Unsent');
  await panel.getByRole('button', { name: 'Back to invitations' }).click();
  await expect(
    panel.getByText('Discard this unsent reply and return to invitations?'),
  ).toBeFocused();
  await expectAccessible(page);
  await panel.getByRole('button', { name: 'Keep writing' }).click();
  await expect(
    panel.getByRole('button', { name: 'Back to invitations' }),
  ).toBeFocused();
  await expect(
    panel.getByRole('textbox', { name: 'Your reply', exact: true }),
  ).toHaveValue('Unsent');
  await panel.getByRole('button', { name: 'Back to invitations' }).click();
  await panel
    .getByRole('button', { name: 'Discard reply and go back' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Open conversation' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Open conversation' }).click();
  await expect(
    panel.getByRole('textbox', { name: 'Your reply', exact: true }),
  ).toBeEmpty();
});

test('older history appends in reading order, focuses it and refresh replaces history', async ({
  page,
}) => {
  const state = await mockConversation(page, {
    messages: [message(3)],
    nextCursor: 'older',
  });
  state.historyHandler = async (route, url) =>
    route.fulfill({
      json: url.searchParams.has('cursor')
        ? { messages: [message(2), message(1)], nextCursor: null }
        : { messages: state.messages, nextCursor: state.nextCursor },
    });
  const panel = await openRoom(page);
  await panel.getByRole('button', { name: 'Load older messages' }).click();
  await expect(
    panel.getByRole('list').locator('li .invitation-message'),
  ).toHaveText(['Message 1', 'Message 2', 'Message 3']);
  await expect(
    panel.getByRole('listitem').filter({ hasText: 'Message 1' }),
  ).toBeFocused();
  expect(state.reads).toContainEqual({ limit: '20', cursor: 'older' });
  state.messages = [message(4, 'New reply', user.id), message(3)];
  state.nextCursor = null;
  await panel.getByRole('button', { name: 'Refresh messages' }).click();
  await expect(
    panel.getByRole('list').locator('li .invitation-message'),
  ).toHaveText(['Message 3', 'New reply']);
});

test('opening failure retries without allowing a premature send', async ({
  page,
}) => {
  const state = await mockConversation(page);
  state.openFailure = {
    status: 503,
    json: { error: 'Conversations are temporarily unavailable.' },
  };
  const panel = await openRoom(page);
  await expect(panel.getByRole('alert')).toContainText(
    'Conversations are temporarily unavailable.',
  );
  await expect(
    panel.getByRole('button', { name: 'Send reply' }),
  ).toBeDisabled();
  state.openFailure = null;
  await panel.getByRole('button', { name: 'Try again' }).click();
  await expect(panel).toContainText('No messages yet.');
});

test('partner availability refresh is informational and does not erase a draft', async ({
  page,
}) => {
  const state = await mockConversation(page);
  const panel = await openRoom(page);
  await panel
    .getByRole('textbox', { name: 'Your reply', exact: true })
    .fill('Still writing');
  state.battery = 'open';
  await panel.getByRole('button', { name: 'Refresh availability' }).click();
  await expect(
    panel.getByRole('region', { name: 'Sarah’s Social Battery' }),
  ).toContainText('Open to Conversations');
  await expect(
    panel.getByRole('textbox', { name: 'Your reply', exact: true }),
  ).toHaveValue('Still writing');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () =>
        globalThis.document.documentElement.scrollWidth <=
        globalThis.innerWidth,
    ),
  ).toBe(true);
  await expectAccessible(page);
});

test('invisible-only replies cannot send while multilingual text and emoji stay intact', async ({
  page,
}) => {
  const state = await mockConversation(page);
  const panel = await openRoom(page);
  const input = panel.getByRole('textbox', { name: 'Your reply', exact: true });
  const send = panel.getByRole('button', { name: 'Send reply' });
  await expect(panel).toContainText('No messages yet.');
  for (const text of [
    '\u200b',
    '\u200c\u200d\ufe0f',
    ' \n\u2060\u200e\u0001 ',
  ]) {
    await input.fill(text);
    await expect(send).toBeDisabled();
    await expect(input).toHaveValue(text);
    expect(state.sends).toHaveLength(0);
  }
  for (const text of [
    'ქართული',
    'می\u200cخواهم',
    'क्\u200dष',
    '👨\u200d👩\u200d👧\u200d👦',
    '❤️',
  ]) {
    await input.fill(text);
    await expect(send).toBeEnabled();
    await send.click();
    await expect(input).toBeEmpty();
    expect(state.sends.at(-1)).toEqual({ text });
    await expect(panel.getByRole('list')).toContainText(text);
  }
});
