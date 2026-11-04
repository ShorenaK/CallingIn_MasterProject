import { test, expect } from '@playwright/test';
import { mockApi, expectAccessible } from './helpers.js';

const user = {
  id: '000000000000000000000001',
  displayName: 'Test',
  email: 'test@example.com',
};
const person = { id: '000000000000000000000002', displayName: 'Sarah' };

async function setup(
  page,
  generate = async () => ({ json: { suggestion: 'Would you like tea?' } }),
) {
  const calls = [];
  const sent = [];
  await mockApi(
    page,
    async (route, path) => {
      if (path === '/api/users/lookup') {
        await route.fulfill({ json: { user: person } });
        return true;
      }
      if (path === '/api/ai-coach/suggestions') {
        const input = route.request().postDataJSON();
        calls.push(input);
        await route.fulfill(await generate(input));
        return true;
      }
      if (path === '/api/invitations') {
        if (route.request().method() === 'POST') {
          const input = route.request().postDataJSON();
          sent.push(input);
          await route.fulfill({
            status: 201,
            json: { invitation: created(input.message) },
          });
        } else
          await route.fulfill({ json: { invitations: [], nextCursor: null } });
        return true;
      }
      return false;
    },
    { user },
  );
  await page.goto('/');
  const panel = page.getByRole('region', { name: 'Send an invitation' });
  await panel
    .getByLabel('Their email address', { exact: true })
    .fill('sarah@example.com');
  await panel.getByRole('button', { name: 'Find person' }).click();
  const coach = panel.getByRole('region', { name: 'AI Coach (optional)' });
  return {
    panel,
    coach,
    calls,
    sent,
    message: panel.getByRole('textbox', { name: 'Your message', exact: true }),
    intent: coach.getByRole('textbox', { name: 'What would you like to say?' }),
    generate: coach.getByRole('button', { name: 'Generate suggestion' }),
    suggestion: coach.getByRole('textbox', { name: 'Suggested message' }),
  };
}

function created(message) {
  return {
    id: '0000000000000000000000c1',
    senderId: user.id,
    recipientId: person.id,
    message,
    status: 'pending',
    createdAt: '2026-11-04T12:00:00.000Z',
  };
}

function held() {
  let release;
  const ready = new Promise((resolve) => {
    release = resolve;
  });
  return { ready, release: (value) => release(value) };
}

test('generation is explicit, editable, separate, and never sends automatically', async ({
  page,
}) => {
  const f = await setup(page);
  await f.message.fill('My own words');
  await f.intent.fill('Ask for tea');
  await f.coach.getByLabel('Suggestion tone').selectOption('warm');
  expect(f.calls).toHaveLength(0);
  await f.generate.focus();
  await page.keyboard.press('Space');
  await expect(f.suggestion).toHaveValue('Would you like tea?');
  await expect(f.generate).toBeFocused();
  await expect(f.message).toHaveValue('My own words');
  expect(f.calls).toEqual([
    { action: 'draft', text: 'Ask for tea', tone: 'warm' },
  ]);
  await f.suggestion.fill('Tea on Saturday?');
  await expectAccessible(page);
  await f.coach
    .getByRole('button', { name: 'Use suggestion', exact: true })
    .click();
  await expect(f.message).toHaveValue('Tea on Saturday?');
  await expect(f.message).toBeFocused();
  expect(f.sent).toHaveLength(0);
  await f.panel.getByRole('button', { name: 'Send invitation' }).click();
  await expect(f.panel.getByText('Invitation sent to Sarah.')).toBeVisible();
  expect(f.sent).toEqual([
    { recipientId: person.id, message: 'Tea on Saturday?' },
  ]);
  await f.panel
    .getByLabel('Their email address', { exact: true })
    .fill('sarah@example.com');
  await f.panel.getByRole('button', { name: 'Find person' }).click();
  await expect(f.intent).toHaveValue('');
});

test('Keep original preserves the draft; refine sends only current text and tone', async ({
  page,
}) => {
  const f = await setup(page);
  await f.message.fill('Hello friend');
  await f.coach.getByLabel('Coach task').selectOption('refine');
  await f.generate.click();
  await expect(f.suggestion).toBeVisible();
  expect(f.calls).toEqual([
    { action: 'refine', text: 'Hello friend', tone: 'natural' },
  ]);
  await f.coach.getByRole('button', { name: 'Keep original' }).click();
  await expect(f.message).toHaveValue('Hello friend');
  await expect(f.suggestion).toHaveCount(0);
  expect(f.sent).toHaveLength(0);
});

test('edits during generation require replacement confirmation; restore also protects new edits', async ({
  page,
}) => {
  const pending = held();
  const f = await setup(page, async () => {
    await pending.ready;
    return { json: { suggestion: 'Suggested tea' } };
  });
  await f.message.fill('Original');
  await f.intent.fill('Tea');
  await f.generate.click();
  await expect(
    f.panel.getByRole('button', { name: 'Send invitation' }),
  ).toBeDisabled();
  await f.message.fill('Newer writing');
  pending.release();
  await expect(f.suggestion).toHaveValue('Suggested tea');
  await f.coach
    .getByRole('button', { name: 'Use suggestion', exact: true })
    .click();
  const question = f.coach.getByText(
    'Your message has changed. Replace the current message?',
  );
  await expect(question).toBeFocused();
  await expect(f.message).toHaveValue('Newer writing');
  await f.coach.getByRole('button', { name: 'Keep current message' }).click();
  await expect(f.message).toBeFocused();
  await f.coach
    .getByRole('button', { name: 'Use suggestion', exact: true })
    .click();
  await f.coach
    .getByRole('button', { name: 'Replace current message' })
    .click();
  await expect(f.message).toHaveValue('Suggested tea');
  await f.message.fill('Another edit');
  await f.coach
    .getByRole('button', { name: 'Restore previous message' })
    .click();
  await expect(question).toBeVisible();
  await f.coach
    .getByRole('button', { name: 'Replace current message' })
    .click();
  await expect(f.message).toHaveValue('Newer writing');
});

test('empty, invisible and overlong input never requests a generation', async ({
  page,
}) => {
  const f = await setup(page);
  for (const text of ['', '\u200b', 'x'.repeat(5001)]) {
    await f.intent.fill(text);
    await f.generate.click();
    await expect(f.coach.getByRole('alert')).toContainText(
      'Enter visible text',
    );
  }
  expect(f.calls).toHaveLength(0);
});

test('empty or overlong edited suggestions stay editable and cannot be used', async ({
  page,
}) => {
  const f = await setup(page);
  await f.intent.fill('Tea');
  await f.generate.click();
  await expect(f.suggestion).toBeVisible();
  for (const text of ['', '\u200b', 'x'.repeat(5001)]) {
    await f.suggestion.fill(text);
    await expect(f.suggestion).toHaveValue(text);
    await expect(
      f.coach.getByRole('button', { name: 'Use suggestion', exact: true }),
    ).toBeDisabled();
  }
  await f.suggestion.fill('Valid again');
  await expect(
    f.coach.getByRole('button', { name: 'Use suggestion', exact: true }),
  ).toBeEnabled();
});

for (const status of [422, 429, 502, 503, 504]) {
  test(`Coach ${status} keeps writing and allows retry`, async ({ page }) => {
    let attempt = 0;
    const f = await setup(page, async () =>
      ++attempt === 1
        ? { status, json: { error: 'Synthetic provider failure' } }
        : { json: { suggestion: 'Try tea?' } },
    );
    await f.message.fill('Original');
    await f.intent.fill('Tea');
    await f.generate.click();
    await expect(f.coach.getByRole('alert')).toContainText(
      'Your writing is kept',
    );
    await expect(f.message).toHaveValue('Original');
    await expect(f.intent).toHaveValue('Tea');
    await f.generate.click();
    await expect(f.suggestion).toHaveValue('Try tea?');
    expect(f.sent).toHaveLength(0);
  });
}

test('invalid server output is rejected without replacing the draft', async ({
  page,
}) => {
  const f = await setup(page, async () => ({
    json: { suggestion: { text: 'Wrong type' } },
  }));
  await f.message.fill('Original');
  await f.intent.fill('Tea');
  await f.generate.click();
  await expect(f.coach.getByRole('alert')).toContainText(
    'Your writing is kept',
  );
  await expect(f.message).toHaveValue('Original');
  await expect(f.suggestion).toHaveCount(0);
});

test('401 keeps text copyable until explicit sign-in', async ({ page }) => {
  const f = await setup(page, async () => ({
    status: 401,
    json: { error: 'Expired' },
  }));
  await f.message.fill('Original');
  await f.intent.fill('Tea');
  await f.generate.click();
  await expect(f.coach.getByRole('alert')).toContainText(
    'Copy your message, intent',
  );
  await expect(f.message).toHaveValue('Original');
  await expect(f.intent).toHaveValue('Tea');
  await expect(f.generate).toHaveAttribute('aria-disabled', 'true');
  await expectAccessible(page);
  await f.coach.getByRole('button', { name: 'Sign in again' }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeFocused();
});

test('Cancel confirms Coach-only writing and Keep writing retains it', async ({
  page,
}) => {
  const f = await setup(page);
  await f.intent.fill('Only Coach intent');
  await f.panel.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(
    f.panel.getByText('Your message and Coach writing will be cleared.', {
      exact: false,
    }),
  ).toBeFocused();
  await f.panel.getByRole('button', { name: 'Keep writing' }).click();
  await expect(f.intent).toHaveValue('Only Coach intent');
  await f.panel.getByRole('button', { name: 'Cancel', exact: true }).click();
  await f.panel.getByRole('button', { name: 'Discard draft' }).click();
  await expect(
    f.panel.getByLabel('Their email address', { exact: true }),
  ).toBeFocused();
});

test('cancelled generation ignores late result and supports a fresh request', async ({
  page,
}) => {
  const pending = held();
  let count = 0;
  const f = await setup(page, async () => {
    count += 1;
    const invocation = count;
    if (invocation === 1) await pending.ready;
    return {
      json: {
        suggestion: invocation === 1 ? 'Late old result' : 'Fresh result',
      },
    };
  });
  await f.intent.fill('Tea');
  await f.generate.click();
  await expect(f.generate).toHaveAttribute('aria-disabled', 'true');
  await f.coach.getByRole('button', { name: 'Cancel generation' }).click();
  await expect(f.generate).toBeFocused();
  pending.release();
  await f.generate.click();
  await expect(f.suggestion).toHaveValue('Fresh result');
  await expect(f.message).toHaveValue('');
});

test('Change person confirms Coach discard, keeps original text, and invalidates pending work', async ({
  page,
}) => {
  const pending = held();
  const f = await setup(page, async () => {
    await pending.ready;
    return { json: { suggestion: 'Old person result' } };
  });
  await f.message.fill('Keep this');
  await f.intent.fill('Tea');
  await f.generate.click();
  await f.panel.getByRole('button', { name: 'Change person' }).click();
  await f.panel
    .getByRole('button', { name: 'Discard Coach writing and change person' })
    .click();
  pending.release();
  await f.panel.getByRole('button', { name: 'Find person' }).click();
  await expect(f.message).toHaveValue('Keep this');
  await expect(f.intent).toHaveValue('');
  await expect(f.suggestion).toHaveCount(0);
});

test('Coach controls fit a narrow viewport and support keyboard apply', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const f = await setup(page);
  await f.intent.fill('A short invitation for tea');
  await f.generate.focus();
  await page.keyboard.press('Enter');
  await expect(f.suggestion).toBeVisible();
  await expectAccessible(page);
  const overflow = await page.evaluate(
    () =>
      globalThis.document.documentElement.scrollWidth > globalThis.innerWidth,
  );
  expect(overflow).toBe(false);
  await f.coach.screenshot({
    path: '/private/tmp/callingin-sprint05-coach-mobile.png',
  });
  await f.coach
    .getByRole('button', { name: 'Use suggestion', exact: true })
    .focus();
  await page.keyboard.press('Space');
  await expect(f.message).toBeFocused();
  await expect(f.message).toHaveValue('Would you like tea?');
  expect(f.sent).toHaveLength(0);
});

test('changing person clears old Coach errors without clearing the invitation', async ({
  page,
}) => {
  const f = await setup(page, async () => ({
    status: 503,
    json: { error: 'Unavailable' },
  }));
  await f.message.fill('Keep my words');
  await f.intent.fill('Tea');
  await f.generate.click();
  await expect(f.coach.getByRole('alert')).toBeVisible();
  await f.panel.getByRole('button', { name: 'Change person' }).click();
  await f.panel
    .getByRole('button', { name: 'Discard Coach writing and change person' })
    .click();
  await f.panel.getByRole('button', { name: 'Find person' }).click();
  await expect(f.message).toHaveValue('Keep my words');
  await expect(f.coach.getByRole('alert')).toHaveCount(0);
});
