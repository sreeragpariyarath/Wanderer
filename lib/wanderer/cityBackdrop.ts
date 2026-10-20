import type { Frame } from './frame';
import { seededRandom, smoothStep } from './math';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';

type CityScenery = Pick<
  RenderState,
  | 'accent'
  | 'character'
  | 'intro'
  | 'introDone'
  | 'reducedMotion'
  | 'time'
  | 'villageColors'
>;

// The backdrop is anchored to the screen, not the world: sky, skyline and
// bridge stay still like a painting while the street in front of them scrolls.
interface SkylineLayer {
  fill: number;
  edge: number;
  minHeight: number;
  maxHeight: number;
  leftScale: number;
  seed: number;
  windows: boolean;
}

const FAR_LAYER: SkylineLayer = {
  fill: 0.05,
  edge: 0.1,
  minHeight: 0.14,
  maxHeight: 0.34,
  leftScale: 0.55,
  seed: 6100,
  windows: false,
};
const MID_LAYER: SkylineLayer = {
  fill: 0.08,
  edge: 0.28,
  minHeight: 0.2,
  maxHeight: 0.44,
  leftScale: 0.18,
  seed: 6700,
  windows: true,
};
const CITY_END = 3900;

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('#') && color.length === 7) {
    const value = parseInt(color.slice(1), 16);
    return `rgba(${value >> 16},${(value >> 8) & 255},${value & 255},${alpha})`;
  }
  return color.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 7);
  ctx.fill();
}

function dotLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  step: number,
  r: number,
  seed: number,
) {
  const count = Math.max(1, Math.floor(Math.hypot(x2 - x1, y2 - y1) / step));
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    dot(
      ctx,
      x1 + (x2 - x1) * t,
      y1 + (y2 - y1) * t,
      r * (0.75 + seededRandom(seed + i * 1.7) * 0.5),
    );
  }
}

function cityVisibility(s: CityScenery, X: number): number {
  const reveal = s.introDone ? 1 : Math.min(1, (s.intro.reveal || 0) / 700);
  return (1 - smoothStep(3300, CITY_END, X)) * reveal;
}

function renderSun(frame: Frame, accent: string, fade: number): void {
  const { ctx, w, h } = frame,
    radius = Math.max(40, w * 0.04),
    x = w * 0.22,
    y = h * 0.43;
  const glow = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.6);
  glow.addColorStop(0, withAlpha(accent, 0.3 * fade));
  glow.addColorStop(0.4, withAlpha(accent, 0.1 * fade));
  glow.addColorStop(1, withAlpha(accent, 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius * 2.6, y - radius * 2.6, radius * 5.2, radius * 5.2);
  ctx.fillStyle = withAlpha(accent, 0.2 * fade);
  dot(ctx, x, y, radius);
}

// A dome built from a grid of dots, like the clouds in the design.
function renderDomeCloud(
  s: CityScenery,
  frame: Frame,
  cx: number,
  baseY: number,
  rx: number,
  ry: number,
  seed: number,
  fade: number,
): void {
  const { ctx, col } = frame,
    gap = 9;
  for (let row = 0; row * gap < ry; row++) {
    const y = baseY - row * gap,
      reach = rx * Math.sqrt(1 - Math.pow((row * gap) / ry, 2));
    for (let x = -reach; x <= reach; x += gap) {
      const id = seed + row * 61 + x,
        warm = seededRandom(id) > 0.55;
      ctx.globalAlpha = (warm ? 0.42 : 0.22) * fade;
      ctx.fillStyle = warm ? s.accent : col.dot;
      dot(ctx, cx + x, y, 1.3);
    }
  }
}

function renderSkyline(
  s: CityScenery,
  frame: Frame,
  gy: number,
  fade: number,
  layer: SkylineLayer,
): void {
  const { ctx, w, h, col } = frame;
  let x = -60,
    i = 0;
  while (x < w + 60) {
    const id = i * 7 + layer.seed,
      bw = 56 + seededRandom(id) * 84,
      sx = x,
      bh =
        h *
        (layer.minHeight +
          seededRandom(id + 1) * (layer.maxHeight - layer.minHeight)) *
        (layer.leftScale +
          (1 - layer.leftScale) * smoothStep(w * 0.26, w * 0.5, sx));
    x += bw + 14 + seededRandom(id + 2) * 70;
    i++;
    const top = gy - bh,
      crown = Math.floor(seededRandom(id + 3) * 3),
      tint = seededRandom(id + 4),
      edgeColor =
        layer.windows && tint > 0.82
          ? s.villageColors[0]
          : layer.windows && tint < 0.1
            ? s.villageColors[1]
            : col.mut;
    // Opaque base first so towers hide whatever is drawn behind them.
    ctx.globalAlpha = fade;
    ctx.fillStyle = col.bg;
    ctx.fillRect(sx, top, bw, bh);
    ctx.globalAlpha = layer.fill * fade;
    ctx.fillStyle = col.dot;
    ctx.fillRect(sx, top, bw, bh);
    ctx.globalAlpha = layer.edge * fade * (edgeColor === col.mut ? 1 : 2);
    ctx.fillStyle = edgeColor;
    dotLine(ctx, sx, gy, sx, top, 8, 1.1, id);
    dotLine(ctx, sx + bw, gy, sx + bw, top, 8, 1.1, id + 40);
    dotLine(ctx, sx, top, sx + bw, top, 8, 1.1, id + 80);
    if (crown === 1) {
      const inset = bw * 0.2,
        rise = bh * 0.1;
      ctx.fillStyle = col.bg;
      ctx.globalAlpha = fade;
      ctx.fillRect(sx + inset, top - rise, bw - inset * 2, rise);
      ctx.fillStyle = edgeColor;
      ctx.globalAlpha = layer.edge * fade;
      dotLine(ctx, sx + inset, top, sx + inset, top - rise, 8, 1, id + 120);
      dotLine(
        ctx,
        sx + bw - inset,
        top,
        sx + bw - inset,
        top - rise,
        8,
        1,
        id + 130,
      );
      dotLine(
        ctx,
        sx + inset,
        top - rise,
        sx + bw - inset,
        top - rise,
        8,
        1,
        id + 140,
      );
    } else if (crown === 2) {
      dotLine(ctx, sx + bw / 2, top, sx + bw / 2, top - bh * 0.18, 7, 1, id);
    }
    if (!layer.windows || seededRandom(id + 5) < 0.45) continue;
    for (let row = 0; ; row++) {
      const wy = top + 16 + row * 22;
      if (wy > gy - 30) break;
      for (let c = 0; c < Math.floor((bw - 12) / 14); c++) {
        const wx = sx + 8 + c * 14,
          lit = seededRandom(id + row * 13 + c * 3) > 0.8;
        ctx.globalAlpha = (lit ? 0.7 : 0.18) * fade;
        ctx.fillStyle = lit ? s.accent : col.dot;
        ctx.fillRect(wx, wy, 2.4, 2.4);
      }
    }
  }
  ctx.globalAlpha = 1;
}

function renderHaze(frame: Frame, gy: number, strength: number): void {
  const { ctx, w, h, col } = frame,
    top = gy - h * 0.5,
    haze = ctx.createLinearGradient(0, top, 0, gy);
  haze.addColorStop(0, withAlpha(col.bg, 0));
  haze.addColorStop(1, withAlpha(col.bg, strength));
  ctx.globalAlpha = 1;
  ctx.fillStyle = haze;
  ctx.fillRect(0, top, w, gy - top);
}

function renderDistantBridge(
  frame: Frame,
  gy: number,
  fade: number,
  accent: string,
): void {
  const { ctx, w, h, col } = frame,
    scale = Math.max(0.7, Math.min(1.4, w / 1600)),
    left = -40 * scale,
    right = left + 820 * scale,
    deckY = gy - h * 0.13,
    towerTop = deckY - h * 0.15,
    towers = [left + 190 * scale, left + 610 * scale],
    half = 8 * scale;
  ctx.fillStyle = col.mut;
  ctx.globalAlpha = 0.5 * fade;
  dotLine(ctx, left, deckY, right, deckY, 7, 1.1, 6300);
  dotLine(ctx, left, deckY + 7, right, deckY + 7, 8, 1, 6310);
  for (const [n, tx] of towers.entries()) {
    dotLine(ctx, tx - half, deckY, tx - half, towerTop, 7, 1.3, 6320 + n);
    dotLine(ctx, tx + half, deckY, tx + half, towerTop, 7, 1.3, 6330 + n);
    dotLine(ctx, tx - half, towerTop, tx + half, towerTop, 6, 1.2, 6340 + n);
    dotLine(
      ctx,
      tx - half,
      towerTop + (deckY - towerTop) * 0.4,
      tx + half,
      towerTop + (deckY - towerTop) * 0.4,
      6,
      1.1,
      6350 + n,
    );
  }
  const [first, second] = towers as [number, number],
    sag = (deckY - towerTop) * 0.7,
    cable = (x: number) => {
      const t = (x - first) / (second - first);
      return towerTop + sag * (1 - Math.pow(1 - 2 * t, 2));
    };
  ctx.globalAlpha = 0.5 * fade;
  for (let x = first; x <= second; x += 6) dot(ctx, x, cable(x), 1);
  dotLine(ctx, left, deckY - 6, first, towerTop, 6, 1, 6360);
  dotLine(ctx, second, towerTop, right, deckY - 6, 6, 1, 6370);
  ctx.globalAlpha = 0.32 * fade;
  for (let x = first + 20 * scale; x < second; x += 24 * scale)
    dotLine(ctx, x, cable(x), x, deckY, 6, 0.8, x);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.5 * fade;
  dot(ctx, first, towerTop - 4, 1.8);
  dot(ctx, second, towerTop - 4, 1.8);
  ctx.globalAlpha = 1;
}

function renderBirds(s: CityScenery, frame: Frame, fade: number): void {
  const { ctx, w, h, col } = frame,
    time = s.reducedMotion ? 0 : s.time;
  ctx.strokeStyle = col.mut;
  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.5 * fade;
  for (let i = 0; i < 3; i++) {
    const span = w + 240,
      x = ((seededRandom(i + 6500) * span + time * (4 + i * 2)) % span) - 120,
      y = h * (0.2 + seededRandom(i + 6510) * 0.26) + Math.sin(time + i) * 5,
      flap = 3 + Math.sin(time * 4 + i * 2) * 2;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - flap);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 6, y - flap);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function renderCityBackdrop(s: CityScenery, frame: Frame): void {
  const { ctx, cam, w, h, X } = frame,
    fade = cityVisibility(s, X);
  if (fade <= 0.01 || cam > CITY_END) return;
  const gy = frame.SY(terrainHeight(s.character.x, X)) + 2;
  renderSun(frame, s.accent, fade);
  renderDomeCloud(s, frame, w * 0.14, h * 0.29, w * 0.12, h * 0.1, 6400, fade);
  renderDomeCloud(
    s,
    frame,
    w * 0.32,
    h * 0.36,
    w * 0.045,
    h * 0.035,
    6450,
    fade,
  );
  renderDomeCloud(s, frame, w * 0.89, h * 0.17, w * 0.07, h * 0.06, 6480, fade);
  renderSkyline(s, frame, gy, fade, FAR_LAYER);
  renderHaze(frame, gy, 0.55);
  renderDistantBridge(frame, gy, fade, s.accent);
  renderSkyline(s, frame, gy, fade, MID_LAYER);
  renderHaze(frame, gy, 0.3);
  renderBirds(s, frame, fade);
  ctx.globalAlpha = 1;
}

function scaleFor(frame: Frame): number {
  return Math.max(0.7, Math.min(1.3, frame.h / 800));
}

// Classic street lantern: stepped base, slim dark pole, dark roof and a
// warm glass lantern with a soft halo, as in the design.
function renderLamp(
  frame: Frame,
  accent: string,
  x: number,
  ground: number,
  fade: number,
): void {
  const { ctx, col } = frame,
    k = scaleFor(frame),
    height = 124 * k,
    lanternBottom = ground - height,
    lanternTop = lanternBottom - 17 * k,
    lanternMid = (lanternTop + lanternBottom) / 2;
  const halo = ctx.createRadialGradient(
    x,
    lanternMid,
    2 * k,
    x,
    lanternMid,
    46 * k,
  );
  halo.addColorStop(0, withAlpha('#f6cf7d', 0.55 * fade));
  halo.addColorStop(0.35, withAlpha(accent, 0.18 * fade));
  halo.addColorStop(1, withAlpha(accent, 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = halo;
  ctx.fillRect(x - 46 * k, lanternMid - 46 * k, 92 * k, 92 * k);
  ctx.globalAlpha = 0.85 * fade;
  ctx.fillStyle = col.ink;
  ctx.strokeStyle = col.ink;
  // Stepped base.
  ctx.fillRect(x - 6 * k, ground - 5 * k, 12 * k, 5 * k);
  ctx.fillRect(x - 4 * k, ground - 11 * k, 8 * k, 6 * k);
  ctx.fillRect(x - 2.5 * k, ground - 16 * k, 5 * k, 5 * k);
  // Slim pole and a collar under the lantern.
  ctx.lineWidth = 2.2 * k;
  ctx.beginPath();
  ctx.moveTo(x, ground - 16 * k);
  ctx.lineTo(x, lanternBottom + 4 * k);
  ctx.stroke();
  ctx.fillRect(x - 4 * k, lanternBottom, 8 * k, 4 * k);
  // Glowing glass, wider at the top.
  ctx.globalAlpha = 0.95 * fade;
  ctx.fillStyle = '#f6d58a';
  ctx.beginPath();
  ctx.moveTo(x - 4 * k, lanternBottom);
  ctx.lineTo(x + 4 * k, lanternBottom);
  ctx.lineTo(x + 6.5 * k, lanternTop);
  ctx.lineTo(x - 6.5 * k, lanternTop);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 1.2 * k;
  ctx.globalAlpha = 0.8 * fade;
  ctx.stroke();
  // Roof and finial.
  ctx.fillStyle = col.ink;
  ctx.globalAlpha = 0.85 * fade;
  ctx.beginPath();
  ctx.moveTo(x - 9 * k, lanternTop);
  ctx.lineTo(x + 9 * k, lanternTop);
  ctx.lineTo(x + 3 * k, lanternTop - 6 * k);
  ctx.lineTo(x - 3 * k, lanternTop - 6 * k);
  ctx.closePath();
  ctx.fill();
  dot(ctx, x, lanternTop - 8 * k, 1.6 * k);
}

// Slatted bench with a backrest and legs, drawn as a dotted outline.
function renderBench(
  frame: Frame,
  x: number,
  ground: number,
  fade: number,
  wide: boolean,
): void {
  const { ctx, col } = frame,
    k = scaleFor(frame),
    half = (wide ? 34 : 22) * k;
  ctx.fillStyle = col.ink;
  ctx.globalAlpha = 0.65 * fade;
  const seat = ground - 15 * k;
  dotLine(ctx, x - half, seat, x + half, seat, 5 * k, 1.1 * k, x);
  dotLine(
    ctx,
    x - half,
    seat - 7 * k,
    x + half,
    seat - 7 * k,
    5 * k,
    1.1 * k,
    x + 3,
  );
  dotLine(
    ctx,
    x - half,
    seat - 20 * k,
    x + half,
    seat - 20 * k,
    5 * k,
    1.1 * k,
    x + 5,
  );
  dotLine(ctx, x - half, seat - 20 * k, x - half, seat, 5 * k, 1.1 * k, x + 8);
  dotLine(ctx, x + half, seat - 20 * k, x + half, seat, 5 * k, 1.1 * k, x + 11);
  dotLine(
    ctx,
    x - half + 5 * k,
    seat,
    x - half + 5 * k,
    ground,
    5 * k,
    1.1 * k,
    x + 13,
  );
  dotLine(
    ctx,
    x + half - 5 * k,
    seat,
    x + half - 5 * k,
    ground,
    5 * k,
    1.1 * k,
    x + 17,
  );
}

// Airy round canopy of evenly spread dots, with an amber trunk and branches.
function renderStreetTree(
  s: CityScenery,
  frame: Frame,
  x: number,
  ground: number,
  fade: number,
  seed: number,
): void {
  const { ctx, col } = frame,
    k = scaleFor(frame),
    trunk = (44 + seededRandom(seed) * 12) * k,
    radius = (32 + seededRandom(seed + 1) * 10) * k,
    centerY = ground - trunk - radius * 0.5,
    gap = 9.5 * k;
  ctx.fillStyle = s.accent;
  ctx.globalAlpha = 0.9 * fade;
  dotLine(ctx, x, ground, x, centerY + radius * 0.55, 6 * k, 1.7 * k, seed);
  for (const [n, lean] of [-1.1, -0.45, 0.45, 1.1].entries()) {
    const reach = radius * (0.55 + (n % 2) * 0.25);
    dotLine(
      ctx,
      x,
      centerY + radius * 0.55,
      x + Math.sin(lean) * reach,
      centerY + radius * 0.55 - Math.cos(lean) * reach,
      6 * k,
      1.1 * k,
      seed + 5 + n,
    );
  }
  // Fill the crown evenly from a lightly jittered hex grid, so no rings show.
  const rowGap = gap * 0.87,
    rows = Math.ceil(radius / rowGap);
  for (let row = -rows; row <= rows; row++) {
    const offset = row & 1 ? gap / 2 : 0;
    for (let dx = -radius - gap + offset; dx <= radius + gap; dx += gap) {
      const id = seed + row * 31 + Math.round(dx),
        px = dx + (seededRandom(id) - 0.5) * gap * 0.3,
        py = row * rowGap + (seededRandom(id + 1) - 0.5) * gap * 0.3;
      if (px * px + py * py > radius * radius) continue;
      // Amber dots follow the branches: a widening wedge below the centre.
      const warm =
        py > -radius * 0.15 &&
        Math.abs(px) < py * 0.9 + radius * 0.18 &&
        seededRandom(id + 2) > 0.45;
      ctx.fillStyle = warm ? s.accent : col.ink;
      ctx.globalAlpha = (warm ? 0.85 : 0.62) * fade;
      dot(ctx, x + px, centerY + py, (warm ? 1.6 : 1.5) * k);
    }
  }
}

// Nearby street life moves with the world, in front of the frozen backdrop.
export function renderCityStreet(s: CityScenery, frame: Frame): void {
  const { ctx, cam, w, h, X, col } = frame,
    fade = cityVisibility(s, X);
  if (fade <= 0.01 || cam > CITY_END) return;
  const groundAt = (x: number) => frame.SY(terrainHeight(s.character.x, x)) + 2,
    reflection = ctx.createLinearGradient(
      0,
      groundAt(X),
      0,
      groundAt(X) + h * 0.14,
    );
  reflection.addColorStop(0, withAlpha(col.dot, 0.1 * fade));
  reflection.addColorStop(1, withAlpha(col.dot, 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = reflection;
  ctx.fillRect(0, groundAt(X), w, h * 0.14);
  // A dark, evenly dotted pavement line, with a fainter echo below it.
  const k = scaleFor(frame),
    step = 12 * k,
    firstDot = Math.floor(cam / step),
    lastDot = Math.ceil((cam + w) / step);
  ctx.fillStyle = col.ink;
  for (let n = firstDot; n <= lastDot; n++) {
    const wx = n * step,
      sx = wx - cam,
      gy = groundAt(wx);
    ctx.globalAlpha = 0.55 * fade;
    dot(ctx, sx, gy, 2.3 * k);
    ctx.globalAlpha = 0.14 * fade;
    dot(ctx, sx, gy + 13 * k, 2 * k);
  }
  const first = Math.floor((cam - 80) / 170),
    last = Math.ceil((cam + w + 80) / 170);
  for (let slot = first; slot <= last; slot++) {
    const x = slot * 170 + seededRandom(slot + 6800) * 70;
    if (x < -300 || x > CITY_END) continue;
    const ground = groundAt(x),
      sx = x - cam,
      kind = ((slot % 6) + 6) % 6;
    if (kind === 2) renderLamp(frame, s.accent, sx, ground, fade);
    else if (kind === 0 || kind === 3)
      renderStreetTree(s, frame, sx, ground, fade, slot * 41 + 6900);
    else renderBench(frame, sx, ground, fade, kind === 5);
  }
  ctx.globalAlpha = 1;
}
