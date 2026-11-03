import { test, expect } from '@playwright/test';
import { expectAccessible } from './helpers.js';
import {
  mockConversation,
  openRoom,
  message,
  room,
  roomId,
} from './conversation-helpers.js';

function gate() {
  let release;
  const promise = new Promise((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

test('refresh keeps keyboard focus while pending, ignores repeat activation and announces completion', async ({
  page,
}) => {
  const state = await mockConversation(page, { messages: [message(1)] });
  const panel = await openRoom(page);
  await expect(panel.getByRole('list')).toContainText('Message 1');
  await expect(
    panel.getByRole('status').filter({ hasText: 'Messages loaded.' }),
  ).toHaveText('Messages loaded.');
  const pending = gate();
  const started = gate();
  state.historyHandler = async (route) => {
    started.release();
    await pending.promise;
    return route.fulfill({
      json: { messages: [message(2)], nextCursor: null },
    });
  };
  try {
    const refresh = panel.getByRole('button', { name: 'Refresh messages' });
    await page.mouse.move(0, 0);
    const background = await refresh.evaluate(
      (button) => globalThis.getComputedStyle(button).backgroundColor,
    );
    await refresh.focus();
    await page.keyboard.press('Enter');
    await started.promise;
    await expect(refresh).toBeFocused();
    await expect(refresh).toHaveAttribute('aria-disabled', 'true');
    await refresh.hover();
    await expect(refresh).toHaveCSS('cursor', 'wait');
    await expect(refresh).toHaveCSS('opacity', '0.65');
    await expect(refresh).toHaveCSS('background-color', background);
    await page.keyboard.press('Enter');
    pending.release();
    await expect(panel.getByRole('list')).toContainText('Message 2');
    await expect(refresh).toBeFocused();
    await expect(
      panel.getByRole('status').filter({ hasText: 'Messages updated.' }),
    ).toHaveText('Messages updated.');
    expect(state.reads).toHaveLength(2);
    await expectAccessible(page);
  } finally {
    pending.release();
  }
});

test('refresh failure retains focus and announces the error', async ({
  page,
}) => {
  const state = await mockConversation(page, { messages: [message(1)] });
  const panel = await openRoom(page);
  await expect(panel.getByRole('list')).toContainText('Message 1');
  state.historyHandler = (route) =>
    route.fulfill({ status: 503, json: { error: 'History unavailable.' } });
  const refresh = panel.getByRole('button', { name: 'Refresh messages' });
  await refresh.focus();
  await page.keyboard.press('Enter');
  await expect(panel.getByRole('alert')).toContainText('History unavailable.');
  await expect(refresh).toBeFocused();
});

test('failed older-page load keeps keyboard focus and can retry with Enter', async ({
  page,
}) => {
  const state = await mockConversation(page, {
    messages: [message(3)],
    nextCursor: 'older',
  });
  const panel = await openRoom(page);
  await expect(panel.getByRole('list')).toContainText('Message 3');
  state.historyHandler = (route) =>
    route.fulfill({
      status: 503,
      json: { error: 'Older history unavailable.' },
    });
  const older = panel.getByRole('button', { name: 'Load older messages' });
  await older.focus();
  await page.keyboard.press('Enter');
  await expect(panel.getByRole('alert')).toContainText(
    'Older history unavailable.',
  );
  await expect(older).toBeFocused();
  state.historyHandler = (route) =>
    route.fulfill({ json: { messages: [message(1)], nextCursor: null } });
  await page.keyboard.press('Enter');
  await expect(
    panel.getByRole('listitem').filter({ hasText: 'Message 1' }),
  ).toBeFocused();
});

for (const status of [404, 409]) {
  test(`opening ${status} offers Back without a pointless retry`, async ({
    page,
  }) => {
    const state = await mockConversation(page);
    state.openFailure = {
      status,
      json: {
        error:
          status === 404
            ? 'Invitation not found.'
            : 'Accept the invitation first.',
      },
    };
    const panel = await openRoom(page);
    await expect(panel.getByRole('alert')).toContainText(
      state.openFailure.json.error,
    );
    await expect(panel.getByRole('button', { name: 'Try again' })).toHaveCount(
      0,
    );
    await expect(
      panel.getByRole('button', { name: 'Send reply' }),
    ).toBeDisabled();
    await panel.getByRole('button', { name: 'Back to invitations' }).click();
    await expect(
      page.getByRole('button', { name: 'Open conversation' }),
    ).toBeFocused();
  });
}

test('opening 401 uses explicit sign-in and never loads history', async ({
  page,
}) => {
  const state = await mockConversation(page);
  state.openFailure = { status: 401, json: { error: 'Sign in to continue.' } };
  await page.goto('/');
  await page.getByRole('button', { name: 'Open conversation' }).click();
  const panel = page.getByRole('region', {
    name: 'Conversation with Sarah',
    exact: true,
  });
  await expect(
    panel.getByRole('textbox', { name: 'Your unsent reply' }),
  ).toBeFocused();
  await expect(panel.getByRole('alert')).toContainText(
    'Your session has ended.',
  );
  expect(state.reads).toHaveLength(0);
  await panel.getByRole('button', { name: 'Sign in again' }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeFocused();
});

for (const conversation of [
  { id: roomId },
  { ...room, invitationId: '000000000000000000000099' },
]) {
  test(`malformed or mismatched opening response is rejected: ${JSON.stringify(conversation)}`, async ({
    page,
  }) => {
    const state = await mockConversation(page);
    state.openFailure = { json: { conversation } };
    const panel = await openRoom(page);
    await expect(panel.getByRole('alert')).toContainText('unexpected response');
    await expect(
      panel.getByRole('button', { name: 'Send reply' }),
    ).toBeDisabled();
    expect(state.reads).toHaveLength(0);
  });
}

for (const status of [200, 401]) {
  test(`late opening ${status} after Back cannot restore chat or expire the session`, async ({
    page,
  }) => {
    const state = await mockConversation(page);
    const pending = gate();
    const started = gate();
    await page.route('**/api/invitations/*/conversation', async (route) => {
      started.release();
      await pending.promise;
      return route.fulfill(
        status === 200
          ? { json: { conversation: room } }
          : { status: 401, json: { error: 'Sign in to continue.' } },
      );
    });
    try {
      const panel = await openRoom(page);
      await started.promise;
      await panel.getByRole('button', { name: 'Back to invitations' }).click();
      const finished = page.waitForResponse((response) =>
        response.url().endsWith('/conversation'),
      );
      pending.release();
      await finished;
      await expect(
        page.getByRole('button', { name: 'Open conversation' }),
      ).toBeFocused();
      await expect(
        page.getByRole('heading', { name: 'Conversation with Sarah' }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('heading', { name: 'Welcome back' }),
      ).toHaveCount(0);
      expect(state.reads).toHaveLength(0);
    } finally {
      pending.release();
    }
  });
}

for (const status of [400, 404]) {
  test(`send ${status} retains the reply and reports the server error`, async ({
    page,
  }) => {
    const state = await mockConversation(page);
    state.sendFailure = {
      status,
      json: {
        error: status === 400 ? 'Message rejected.' : 'Conversation not found.',
      },
    };
    const panel = await openRoom(page);
    const input = panel.getByRole('textbox', {
      name: 'Your reply',
      exact: true,
    });
    await input.fill('Keep my text');
    await panel.getByRole('button', { name: 'Send reply' }).click();
    await expect(panel.getByRole('alert')).toContainText(
      state.sendFailure.json.error,
    );
    await expect(input).toHaveValue('Keep my text');
    await expect(input).toBeFocused();
  });
}

test('Tab and Shift+Tab traverse conversation controls and Keep writing restores the reply', async ({
  page,
}) => {
  await mockConversation(page, { messages: [message(1)], nextCursor: 'older' });
  const panel = await openRoom(page);
  const input = panel.getByRole('textbox', { name: 'Your reply', exact: true });
  await expect(input).toBeEditable();
  await expect(
    panel.getByRole('button', { name: 'Refresh availability' }),
  ).toBeEnabled();
  await input.fill('Keyboard draft');
  const back = panel.getByRole('button', { name: 'Back to invitations' });
  await back.focus();
  const controls = [
    panel.locator('summary'),
    panel.getByRole('button', { name: 'Refresh availability' }),
    panel.getByRole('button', { name: 'Refresh messages' }),
    panel.getByRole('button', { name: 'Load older messages' }),
    input,
    panel.getByRole('button', { name: 'Send reply' }),
  ];
  for (const control of controls) {
    await page.keyboard.press('Tab');
    await expect(control).toBeFocused();
  }
  for (const control of [...controls.slice(0, -1)].reverse().concat([back])) {
    await page.keyboard.press('Shift+Tab');
    await expect(control).toBeFocused();
  }
  await page.keyboard.press('Enter');
  await expect(
    panel.getByText('Discard this unsent reply and return to invitations?'),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    panel.getByRole('button', { name: 'Keep writing' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    panel.getByRole('button', { name: 'Discard reply and go back' }),
  ).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('Keyboard draft');
  await expectAccessible(page);
});
