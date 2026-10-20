import { expect, test, type Page } from '@playwright/test';
async function start(page: Page, checkpoint?: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip introduction' }).click();
  if (checkpoint)
    await page
      .getByRole('navigation', { name: 'Checkpoints' })
      .getByRole('button', { name: checkpoint })
      .click();
}
test('local typeface reaches both DOM and canvas rendering', async ({
  page,
}) => {
  await start(page);
  const typography = await page.evaluate(async () => {
    await document.fonts.ready;
    const rootStyle = getComputedStyle(document.documentElement);
    const localFamily = rootStyle
      .getPropertyValue('--font-volkswagen-serial')
      .trim();
    const canvas = document.querySelector('canvas');
    return {
      localFamily,
      bodyFont: getComputedStyle(document.body).fontFamily,
      canvasFont: canvas?.getContext('2d')?.font ?? '',
    };
  });
  const primaryFamily = typography.localFamily
    .split(',')[0]
    ?.replaceAll(/["']/g, '')
    .trim();
  expect(primaryFamily).toBeTruthy();
  expect(typography.bodyFont).toContain(primaryFamily);
  expect(typography.canvasFont).toContain(primaryFamily);
});
test('every visit starts from the beginning with sound off', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, 'River');
  await expect(page.getByRole('group', { name: 'Language' })).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Enable sound' }).click();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Skip introduction' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Skip introduction' }).click();
  await expect(
    page.getByRole('button', { name: 'Enable sound' }),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'City' })).toHaveAttribute(
    'aria-current',
    'location',
  );
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(errors).toEqual([]);
});
test('checkpoint bar jumps to a section and tracks the current one', async ({
  page,
}) => {
  await start(page);
  const bar = page.getByRole('navigation', { name: 'Checkpoints' });
  await expect(bar.getByRole('button')).toHaveCount(5);
  for (const name of ['Forest', 'Grove', 'City']) {
    await bar.getByRole('button', { name }).click();
    await expect(bar.getByRole('button', { name })).toHaveAttribute(
      'aria-current',
      'location',
    );
  }
});
test('river exposes vertical swim controls and reaches the far bank', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page, 'River');
  await page.locator('canvas').click({ position: { x: 200, y: 200 } });
  await page.keyboard.down('d');
  const swimUp = page.getByRole('button', { name: 'swim up' });
  const swimDown = page.getByRole('button', { name: 'swim down' });
  await expect(swimUp).toBeVisible({ timeout: 7000 });
  await page.keyboard.up('d');
  await page.keyboard.down('s');
  await expect(swimDown).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(400);
  await page.keyboard.up('s');
  await page.keyboard.down('w');
  await expect(swimUp).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(400);
  await page.keyboard.up('w');
  await page.screenshot({ path: info.outputPath('underwater-river.png') });
  await page.keyboard.down('Shift');
  await page.keyboard.down('d');
  const wreck = page
    .locator('.story-card')
    .filter({ hasText: 'The Quiet Wreck' });
  await expect(wreck).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(600);
  await page.keyboard.up('d');
  await page.keyboard.up('Shift');
  await wreck.getByRole('button', { name: /Read story/ }).click();
  await expect(wreck).toContainText('Small fish shelter');
  await page.screenshot({ path: info.outputPath('wreck-discovery.png') });
  await wreck.getByRole('button', { name: 'Close', exact: true }).click();
  await page.keyboard.down('Shift');
  await page.keyboard.down('d');
  await expect(swimUp).toBeHidden({ timeout: 13000 });
  await page.keyboard.up('d');
  await page.keyboard.up('Shift');
  await page.screenshot({ path: info.outputPath('river-shore.png') });
  expect(errors).toEqual([]);
});
test('story opens with pointer and keyboard; repeat does not toggle; stays within viewport', async ({
  page,
}) => {
  await start(page, 'Bridge');
  const card = page.locator('.story-card');
  await card.getByRole('button', { name: /Read story/ }).click();
  await expect(card.getByRole('button', { name: 'Close' })).toBeVisible();
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await page.keyboard.press('Space');
  await expect(card.getByRole('button', { name: /Read story/ })).toBeVisible();
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await page.keyboard.up('Space');
  await expect(card.getByRole('button', { name: 'Close' })).toBeVisible();
  await page.setViewportSize({ width: 360, height: 480 });
  await expect
    .poll(async () => {
      const b = await card.boundingBox();
      return Boolean(
        b &&
        b.x >= 15 &&
        b.y >= 15 &&
        b.x + b.width <= 345 &&
        b.y + b.height <= 465,
      );
    })
    .toBe(true);
  await expect(card).toHaveCSS('overflow', 'auto');
});
test('vehicle entry, fast exit restriction and checkpoint exit', async ({
  page,
}) => {
  await start(page);
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await page.keyboard.down('Shift');
  await page.keyboard.down('d');
  await page
    .getByRole('button', { name: 'Get in the car' })
    .waitFor({ state: 'visible', timeout: 10000 });
  await page.keyboard.up('d');
  await page.keyboard.up('Shift');
  await page.getByRole('button', { name: 'Get in the car' }).click();
  await page.keyboard.down('d');
  await page.waitForTimeout(800);
  await expect(
    page.getByRole('button', { name: 'Get out of the car' }),
  ).toBeDisabled();
  await page.keyboard.up('d');
  await page.getByRole('button', { name: 'Forest' }).click();
  await expect(
    page.getByRole('button', { name: 'Get out of the car' }),
  ).toBeHidden();
});
test('pointer capture survives dragging and cancellation releases movement', async ({
  page,
}) => {
  await start(page);
  const forward = page.getByRole('button', { name: 'forward', exact: true }),
    box = await forward.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(10, 10);
  await expect(forward).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(300);
  await forward.dispatchEvent('pointercancel', { pointerId: 1 });
  await expect(forward).toHaveAttribute('aria-pressed', 'false');
  await page.mouse.up();
});
test('blur clears held inputs and native focused buttons retain Space', async ({
  page,
}) => {
  await start(page);
  await page.keyboard.down('d');
  await expect(
    page.getByRole('button', { name: 'forward', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(
    page.getByRole('button', { name: 'forward', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.up('d');
  await page.getByRole('button', { name: 'Enable sound', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(
    page.getByRole('button', { name: 'Mute sound' }),
  ).toHaveAttribute('aria-pressed', 'true');
});
test('reduced motion skips introduction', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Skip introduction' }),
  ).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'forward', exact: true }),
  ).toBeVisible();
});
test('blocked storage and unavailable audio do not prevent navigation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
    Object.defineProperty(window, 'AudioContext', { value: undefined });
    Object.defineProperty(window, 'webkitAudioContext', { value: undefined });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip introduction' }).click();
  await page.getByRole('button', { name: 'Enable sound' }).click();
  await expect(
    page.getByRole('button', { name: 'forward', exact: true }),
  ).toBeVisible();
});
test('representative scene renders and resizes without errors', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, 'Bridge');
  await page.waitForTimeout(300);
  await page.screenshot({ path: info.outputPath('bridge.png') });
  await page.setViewportSize({ width: 800, height: 360 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: info.outputPath('landscape.png') });
  expect(errors).toEqual([]);
});

test('normal introduction completes without input and replays on reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Skip introduction' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'forward', exact: true }),
  ).toBeVisible({ timeout: 18000 });
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Skip introduction' }),
  ).toBeVisible();
});
