import { expect, it } from 'vitest';
import { WORLD } from '../lib/wanderer/config';
import type { Frame } from '../lib/wanderer/frame';
import { createScene } from '../lib/wanderer/initialize';
import { renderRain } from '../lib/wanderer/weatherRender';

function rainContext(): CanvasRenderingContext2D {
  let savedAlpha = 1;
  let savedStrokeStyle = '#000';
  let savedLineWidth = 1;
  const context = {
    globalAlpha: 0.42,
    strokeStyle: '#123456',
    lineWidth: 4,
    save() {
      savedAlpha = this.globalAlpha;
      savedStrokeStyle = this.strokeStyle;
      savedLineWidth = this.lineWidth;
    },
    restore() {
      this.globalAlpha = savedAlpha;
      this.strokeStyle = savedStrokeStyle;
      this.lineWidth = savedLineWidth;
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    ellipse() {},
    stroke() {},
  };
  return context as unknown as CanvasRenderingContext2D;
}

it('keeps rain opacity from leaking into later renderers', () => {
  const scene = createScene();
  scene.character.x = WORLD.bridgeStart + 450;
  scene.rain = [{ x: 0.5, y: 0.5, sp: 0.5 }];
  const ctx = rainContext();
  const frame = {
    ctx,
    cam: WORLD.bridgeStart,
    SY: (y: number) => y,
    w: 1280,
    h: 800,
    X: scene.character.x,
  } as unknown as Frame;

  renderRain(scene, frame);

  expect(ctx.globalAlpha).toBe(0.42);
  expect(ctx.strokeStyle).toBe('#123456');
  expect(ctx.lineWidth).toBe(4);
});
