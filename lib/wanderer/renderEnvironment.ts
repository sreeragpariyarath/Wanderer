import { renderBridge } from './bridge';
import { renderBridgeBackdrop, renderBridgeForeground } from './bridgeBackdrop';
import { renderCity } from './buildings';
import { renderFigure } from './characterRender';
import {
  renderForestBackdrop,
  renderForestSeeds,
  renderForestUndergrowth,
} from './forestBackdrop';
import { renderCityBackdrop, renderCityStreet } from './cityBackdrop';
import type { Frame } from './frame';
import { renderGround } from './ground';
import { renderGrove, renderGroveBackdrop } from './grove';
import { renderRiverSky } from './riverSky';
import { renderParticleRender } from './particleRender';
import type { RenderState } from './state';
import { renderTrees } from './trees';
import { renderCar } from './vehicleRender';
import { renderWater, renderWaterOverlay } from './water';
import { renderRain, renderSky, renderStars } from './weatherRender';
export function renderEnvironment(s: RenderState, frame: Frame): void {
  const { ctx, cam, SY, w, h, col, X } = frame;
  renderSky(s, frame);
  renderCityBackdrop(s, frame);
  renderForestBackdrop(s, frame);
  renderBridgeBackdrop(s, frame);
  renderRiverSky(s, frame);
  renderGroveBackdrop(s, frame);
  renderCity(s, ctx, cam, SY, w, col);
  renderCityStreet(s, frame);
  renderStars(s, frame);
  renderTrees(s, frame);
  renderForestUndergrowth(s, frame);
  renderGrove(s, frame);
  renderForestSeeds(s, frame);
  renderRain(s, frame);
  renderWater(s, frame);
  renderBridge(s, frame);
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
  renderBridgeForeground(s, frame);
}
