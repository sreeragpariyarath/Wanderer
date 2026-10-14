export function seededRandom(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

export function smoothStep(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

export function terrainHeight(x) {
  let y = Math.sin(x * 0.0018) * 10 + Math.sin(x * 0.0007 + 1) * 14;
  y *= 1 - (this.ss(6850, 7000, x) - this.ss(8300, 8360, x));
  y += 260 * this.ss(8300, 8420, x);
  y -= 560 * this.ss(11000, 12100, x);
  y -= 900 * this.ss(13900, 13940, x);
  if (x > 7000 && x < 8300 && this.x > 7000 && this.x < 8300) {
    const ends = this.ss(7000, 7200, x) * (1 - this.ss(8100, 8300, x)) * this.ss(7000, 7150, this.x) * (1 - this.ss(8150, 8300, this.x));
    y += ends * 2.5 * Math.exp(-Math.pow((x - this.x) / 40, 2));
  }
  return y;
}

export function darknessAt(x) { return this.ss(8360, 8520, x) - this.ss(11100, 12100, x) + this.ss(13900, 14300, x); }

export function readColor(str) { const c = this._c || (this._c = document.createElement('canvas').getContext('2d', { willReadFrequently: true })); c.clearRect(0, 0, 1, 1); c.fillStyle = '#000'; c.fillStyle = str; c.fillRect(0, 0, 1, 1); const d = c.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; }

export function mixColor(a, b, t) { return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`; }

export function createTreePoints(seed, h, type) {
  const pts = [];
  const T = [
    { R: .32, sx: 1, sy: .9, trunk: .38, blobs: [[0, 0, 1], [-.55, .35, .7], [.55, .3, .72], [-.2, -.45, .68], [.3, -.4, .62]] },
    { R: .22, sx: .9, sy: 1.6, trunk: .3, blobs: [[0, 0, 1], [0, -.7, .8], [0, .7, .85], [-.3, .2, .7], [.3, -.2, .7]] },
    { R: .3, sx: 1.6, sy: .7, trunk: .5, blobs: [[0, 0, 1], [-1, .25, .75], [1, .2, .8], [-.5, -.35, .7], [.55, -.3, .65]] },
    { R: .26, sx: 1, sy: .9, trunk: .45, blobs: [[-.6, .1, .85], [.7, -.25, .9], [.05, -.75, .7], [0, .3, .6]] },
    { R: .4, sx: 1.3, sy: .8, trunk: .2, blobs: [[0, 0, 1], [-.6, .2, .75], [.6, .25, .7]] }
  ][type % 5];
  const R = h * T.R, cy = -h + R * T.sy;
  const lean = (this.rand(seed + 7) - .5) * 0.25;
  const tH = h - R * T.sy * (1 - T.trunk);
  for (let i = 0; i < 90; i++) { const a = this.rand(seed + i * 3), b = this.rand(seed + i * 3 + 1), c = this.rand(seed + i * 3 + 2); pts.push({ x: (a - .5) * (6 + h * .03) * (1 + (1 - b) * .4) + lean * b * tH, y: -b * tH, r: 1 + c * 2, trunk: true, c }); }
  if (type % 5 === 2) for (let i = 0; i < 40; i++) { const b = this.rand(seed + 300 + i), s = i % 2 ? 1 : -1; pts.push({ x: lean * tH * .6 + s * b * R * .9, y: -tH * .6 - b * R * .5, r: 1 + this.rand(seed + 400 + i) * 1.5, trunk: true, c: .5 }); }
  const n = Math.round(260 + h * 1.1);
  for (let i = 0; i < n; i++) {
    const a = this.rand(seed + 5000 + i * 3), b = this.rand(seed + 5001 + i * 3), c = this.rand(seed + 5002 + i * 3);
    const bl = T.blobs[Math.floor(this.rand(seed + 9000 + i) * T.blobs.length)];
    const ang = a * Math.PI * 2, rr = Math.sqrt(b) * R * bl[2];
    const x = lean * tH + bl[0] * R * T.sx + Math.cos(ang) * rr * T.sx, y = cy + bl[1] * R * T.sy + Math.sin(ang) * rr * T.sy * .85;
    const shade = (y - (cy - R * T.sy)) / (R * T.sy * 2.2) + (x / (R * T.sx)) * 0.15;
    pts.push({ x, y, r: 1.2 + c * 3, trunk: false, c, shade });
  }
  return pts;
}

export function createCloudPoints(seed) { const pts = []; for (let i = 0; i < 90; i++) { const a = this.rand(seed + i * 3), b = this.rand(seed + i * 3 + 1), c = this.rand(seed + i * 3 + 2); pts.push({ x: (a - .5) * 240, y: (b - .5) * 60 * (1 - Math.abs(a - .5) * 1.4), r: .8 + c * 2.2, c }); } return pts; }
