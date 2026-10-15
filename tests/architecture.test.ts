import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
it('feature modules have no dependency on the engine class', () => {
  for (const file of readdirSync(resolve('lib/wanderer')).filter((f) =>
    f.endsWith('.ts'),
  )) {
    const text = readFileSync(resolve('lib/wanderer', file), 'utf8');
    expect(text, file).not.toMatch(/WandererEngine|\.call\(this/);
  }
});
