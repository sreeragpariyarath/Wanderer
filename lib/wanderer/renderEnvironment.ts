import { renderBridge } from './bridge';
import { renderCity } from './buildings';
import { renderFigure } from './characterRender';
import { renderCityBackdrop, renderCityStreet } from './cityBackdrop';
import { renderClouds } from './clouds';
import type { Frame } from './frame';
import { renderGround } from './ground';
import { seededRandom } from './math';
import { renderMountains } from './mountains';
import { renderParticleRender } from './particleRender';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';
import { renderTrees } from './trees';
import { renderCar } from './vehicleRender';
import { renderVillage } from './village';
import { renderWater, renderWaterOverlay } from './water';
import { renderRain, renderSky, renderStars } from './weatherRender';
export function renderEnvironment(s: RenderState, frame: Frame): void {
  const { ctx, cam, SY, w, h, col, X, nightA } = frame;
  renderClouds(s, frame);
  renderSky(s, frame);
  renderMountains(s, frame);
  renderCityBackdrop(s, frame);
  renderCity(s, ctx, cam, SY, w, col);
  renderCityStreet(s, frame);
  renderStars(s, frame);
  renderTrees(s, frame);
  // seeds
  for (const seed of s.seeds) {
    const life = (s.time * seed.sp * 0.08 + seed.off) % 1;
    const sx = seed.x - cam + Math.sin(s.time + seed.off * 9) * 18 + life * 60;
    if (sx < -20 || sx > w + 20) continue;
    const sy = SY(terrainHeight(s.character.x, seed.x)) - 20 - life * h * 0.55;
    ctx.globalAlpha = Math.sin(life * Math.PI) * 0.8;
    ctx.strokeStyle = col.mut;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 2, sy + 10);
    ctx.stroke();
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.38;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a) * 6, sy + Math.sin(a) * 6);
      ctx.stroke();
    }
  }
  renderRain(s, frame);
  renderWater(s, frame);
  renderBridge(s, frame);
  renderVillage(s, frame);
  // floating island underside
  if (cam + w > 13900) {
    const top = SY(-900);
    for (
      let wx = Math.max(13950, Math.floor(cam / 10) * 10);
      wx < Math.min(s.worldWidth, cam + w + 10);
      wx += 10
    ) {
      const sx = wx - cam,
        u = (wx - 13950) / (s.worldWidth - 13950),
        depth = Math.sin(Math.PI * Math.min(1, u * 1.6)) * 260;
      for (let k = 1; k <= 4; k++) {
        const rv = seededRandom(wx * 0.37 + k * 71);
        if (rv < 0.4) continue;
        ctx.globalAlpha = (0.25 + rv * 0.35) * nightA * (1 - k * 0.15);
        ctx.fillStyle = s.particleColors[Math.floor(rv * 2)];
        ctx.beginPath();
        ctx.arc(
          sx,
          top + depth * (k / 4) + Math.sin(s.time * 0.7 + wx * 0.01) * 2,
          1 + rv * 1.6,
          0,
          7,
        );
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;

  renderGround(s, frame);
  renderParticleRender(s, frame);
  // captions
  // Only the nearest caption is drawn so neighbours never overlap mid-fade.
  let nearest: (typeof s.captions)[number] | undefined;
  for (const c of s.captions)
    if (!nearest || Math.abs(X - c.x) < Math.abs(X - nearest.x)) nearest = c;
  for (const c of nearest ? [nearest] : []) {
    const d = Math.abs(X - c.x);
    if (d > 600) continue;
    ctx.globalAlpha =
      Math.max(0, 1 - d / 500) * (1 - Math.min(1, (s.cardOpacity || 0) * 1.5));
    ctx.fillStyle = col.ink;
    ctx.textAlign = 'center';
    ctx.font = `italic 400 ${Math.max(22, Math.min(34, w / 40))}px ${s.headingFont}`;
    const ct = c.en,
      cy = h * (c.x < 2100 ? 0.2 : 0.3);
    ctx.save();
    ctx.strokeStyle = col.bg;
    ctx.lineWidth = 7;
    ctx.lineJoin = 'round';
    ctx.strokeText(ct, w / 2, cy);
    ctx.restore();
    ctx.fillText(ct, w / 2, cy);
  }
  ctx.globalAlpha = 1;
  if (!s.vehicle.in) renderCar(s, ctx, cam, SY, w, col);
  if (!s.intro.onSwing && !s.vehicle.in)
    renderFigure(s, ctx, s.character.x - cam, SY(s.character.y), col);
  if (s.vehicle.in) renderCar(s, ctx, cam, SY, w, col);
  renderWaterOverlay(s, frame);
}
