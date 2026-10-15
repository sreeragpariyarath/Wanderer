import { test, expect } from '@playwright/test';
test('two touch points keep run and movement independent', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Touch device case');
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip introduction' }).click();
  const move = page.getByRole('button', { name: 'forward', exact: true }),
    run = page.getByRole('button', { name: 'run', exact: true });
  const a = await move.boundingBox(),
    b = await run.boundingBox();
  expect(a && b).toBeTruthy();
  const cdp = await context.newCDPSession(page);
  const first = { id: 1, x: a!.x + a!.width / 2, y: a!.y + a!.height / 2 };
  const second = { id: 2, x: b!.x + b!.width / 2, y: b!.y + b!.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [first],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [first, second],
  });
  await expect(move).toHaveAttribute('aria-pressed', 'true');
  await expect(run).toHaveAttribute('aria-pressed', 'true');
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [second],
  });
  await expect(run).toHaveAttribute('aria-pressed', 'false');
  await expect(move).toHaveAttribute('aria-pressed', 'true');
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchCancel',
    touchPoints: [],
  });
  await expect(move).toHaveAttribute('aria-pressed', 'false');
});
test('full journey reaches the island using real controls', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'Full route is covered once');
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip introduction' }).click();
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await page.keyboard.down('d');
  await page
    .getByRole('button', { name: 'Get in the car' })
    .waitFor({ state: 'visible', timeout: 10000 });
  await page.keyboard.press('Space');
  await page.keyboard.up('d');
  await expect(
    page.getByRole('button', { name: 'Get out of the car' }),
  ).toBeVisible();
  await page.keyboard.down('Shift');
  await page.keyboard.down('d');
  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem('wanderer-save-v1') ?? '{}').vehicle
              ?.arrived,
        ),
      { timeout: 25000 },
    )
    .toBe(true);
  await page.keyboard.up('d');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(750);
  await page.keyboard.down('Shift');
  await page.keyboard.down('d');
  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem('wanderer-save-v1') ?? '{}').x ?? 0,
        ),
      { timeout: 65000 },
    )
    .toBeGreaterThanOrEqual(14000);
  await page.keyboard.up('d');
  await page.keyboard.up('Shift');
  await page.screenshot({ path: info.outputPath('island-finish.png') });
  expect(errors).toEqual([]);
});
