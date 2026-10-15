import { expect, test, type Page } from '@playwright/test';
const key = 'wanderer-save-v1';
async function seed(
  page: Page,
  x: number,
  vehicle = { x: 760, in: false, started: false, arrived: false },
) {
  await page.addInitScript(
    ({ key, x, vehicle }) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.clear();
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            x,
            lang: 'en',
            sound: false,
            introComplete: true,
            vehicle,
          }),
        );
        sessionStorage.setItem('seeded', '1');
      }
    },
    { key, x, vehicle },
  );
}
async function progress(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? 'null'),
    key,
  );
}
async function flush(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
}
test('first visit skips immediately, uses English and restores sound preferences', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip introduction' }).click();
  await expect(
    page.getByRole('button', { name: 'forward', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('group', { name: 'Language' })).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Enable sound' }).click();
  await flush(page);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Mute sound' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('button', { name: 'Skip introduction' }),
  ).toBeHidden();
  expect(errors).toEqual([]);
});
test('refresh restores the latest reached section checkpoint', async ({
  page,
}) => {
  await seed(page, 5100);
  await page.goto('/');
  await expect
    .poll(() => progress(page), { timeout: 3000 })
    .toMatchObject({ x: 3500 });
  await page.reload();
  await expect.poll(() => progress(page)).toMatchObject({ x: 3500 });
});
test('river exposes vertical swim controls and reaches the far bank', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await seed(page, 8200);
  await page.goto('/');
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
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
  await expect(swimUp).toBeHidden({ timeout: 9000 });
  await page.keyboard.up('d');
  await page.keyboard.up('Shift');
  expect(errors).toEqual([]);
});
test('story opens with pointer and keyboard; repeat does not toggle; stays within viewport', async ({
  page,
}) => {
  await seed(page, 5100);
  await page.goto('/');
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
test('vehicle entry, fast exit restriction, stopped restore and touch exit', async ({
  page,
}) => {
  await seed(page, 760);
  await page.goto('/');
  await page.getByRole('button', { name: 'Get in the car' }).click();
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await page.keyboard.down('d');
  await page.waitForTimeout(800);
  await expect(
    page.getByRole('button', { name: 'Get out of the car' }),
  ).toBeDisabled();
  await flush(page);
  expect((await progress(page)).vehicle.in).toBe(true);
  await page.keyboard.up('d');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Get out of the car' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Get out of the car' }).click();
  await flush(page);
  expect((await progress(page)).vehicle.in).toBe(false);
});
test('pointer capture survives dragging and cancellation releases movement', async ({
  page,
}) => {
  await seed(page, 1000);
  await page.goto('/');
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
  await seed(page, 1000);
  await page.goto('/');
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
  await seed(page, 7550);
  await page.goto('/');
  await page.waitForTimeout(300);
  await page.screenshot({ path: info.outputPath('bridge.png') });
  await page.setViewportSize({ width: 800, height: 360 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: info.outputPath('landscape.png') });
  expect(errors).toEqual([]);
});

test('normal introduction completes without input and is not replayed', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Skip introduction' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'forward', exact: true }),
  ).toBeVisible({ timeout: 18000 });
  await flush(page);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Skip introduction' }),
  ).toBeHidden();
});
