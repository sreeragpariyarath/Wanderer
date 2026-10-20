import { createFrame, type Frame } from './frame';
import { renderIntroLayer } from './loadingRender';
import { renderEnvironment } from './renderEnvironment';
import type { RenderState } from './state';
/** Browser resources belong to the renderer, never to simulation state. */
export class SceneRenderer {
  private introCanvas: HTMLCanvasElement | null = null;
  private layers = new Map<string, HTMLCanvasElement>();
  render(s: RenderState, canvas: HTMLCanvasElement): Frame | null {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (w <= 0 || h <= 0) return null;
    const dpr = window.devicePixelRatio || 1;
    const pw = Math.round(w * dpr),
      ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const frame = createFrame(s, ctx, w, h),
      { cam, SY, col } = frame;
    frame.layer = (id, draw, alpha, offsetY) => {
      // Key on a coarse brightness bucket of the background, so a day/night
      // fade redraws a cached layer only a few times rather than every frame.
      const levels = col.bg.match(/d+/g)?.map(Number) ?? [0],
        tone = Math.round(
          levels.reduce((sum, v) => sum + v, 0) / levels.length / 64,
        ),
        key = `${id}:${pw}x${ph}:${tone}`;
      let layer = this.layers.get(key);
      if (!layer) {
        for (const old of this.layers.keys())
          if (old.startsWith(`${id}:`)) this.layers.delete(old);
        layer = document.createElement('canvas');
        layer.width = pw;
        layer.height = ph;
        const o = layer.getContext('2d');
        if (!o) return;
        o.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(o);
        this.layers.set(key, layer);
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, Math.round(offsetY * dpr));
      ctx.globalAlpha = alpha;
      ctx.drawImage(layer, 0, 0);
      ctx.restore();
    };
    const fade =
      s.intro.landT == null
        ? 1
        : 1 - Math.min(1, Math.max(0, (s.time - s.intro.landT - 0.2) / 1.1));
    if (fade >= 1) renderIntroLayer(s, ctx, cam, SY, w, col);
    else if (fade > 0) {
      const oc =
        this.introCanvas ??
        (this.introCanvas = document.createElement('canvas'));
      if (oc.width !== pw || oc.height !== ph) {
        oc.width = pw;
        oc.height = ph;
      }
      const o = oc.getContext('2d');
      if (o) {
        o.setTransform(1, 0, 0, 1, 0, 0);
        o.clearRect(0, 0, pw, ph);
        o.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderIntroLayer(s, o, cam, SY, w, col);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = fade;
        ctx.drawImage(oc, 0, 0);
        ctx.restore();
      }
    }
    renderEnvironment(s, frame);
    if (s.introDone) {
      const width = Math.min(240, w - 40),
        left = w / 2 - width / 2,
        y = h * 0.91 + 28;
      for (let i = 0; i <= 40; i++) {
        const f = i / 40;
        ctx.fillStyle = f <= s.character.x / s.worldWidth ? s.accent : col.dot;
        ctx.globalAlpha = f <= s.character.x / s.worldWidth ? 0.9 : 0.4;
        ctx.beginPath();
        ctx.arc(left + f * width, y, 1, 0, 7);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    return frame;
  }
  dispose(): void {
    this.introCanvas = null;
    this.layers.clear();
  }
}
