/**
 * Warm Emergence — ФРИПЕТ generative algorithm (p5.js)
 * Standalone extract of the viewer logic. Seeded, reproducible.
 * Usage in browser with p5 global: set FRIPET_PARAMS then call fripetSetup(p)/fripetDraw(p).
 * Species seeds: dog:11, cat:7, hamster:21, parrot:33, fish:44, turtle:55, rabbit:66, unknown:99
 */

const FRIPET_DEFAULTS = {
  seed: 7,
  species: 'cat',
  particleCount: 1600,
  flowSpeed: 0.9,
  noiseScale: 0.004,
  fieldScale: 1.4,
  trailAlpha: 14,
  warmthBias: 68,
  colorPalette: ['#fb923c', '#34d399', '#ffedd5'],
};

const FRIPET_SPECIES_HUE = { dog: 18, cat: 32, hamster: 42, parrot: 150, fish: 172, turtle: 120, rabbit: 45, unknown: 26 };
const FRIPET_PRESETS = {
  dog: { seed: 11, warmthBias: 78 }, cat: { seed: 7, warmthBias: 68 },
  hamster: { seed: 21, warmthBias: 72 }, parrot: { seed: 33, warmthBias: 38 },
  fish: { seed: 44, warmthBias: 30 }, turtle: { seed: 55, warmthBias: 42 },
  rabbit: { seed: 66, warmthBias: 60 }, unknown: { seed: 99, warmthBias: 66 },
};

function fripetHexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 251, g: 146, b: 60 };
}

class FripetParticle {
  constructor(p, params, anywhere) {
    this.p = p; this.params = params; this.respawn(anywhere);
    this.life = Math.floor(p.random(40, 130));
  }
  respawn(anywhere) {
    const p = this.p, W = p.width, H = p.height;
    const edge = Math.floor(p.random(4));
    if (!anywhere || edge === 0) this.pos = p.createVector(p.random(W), p.random(-20, 30));
    else if (edge === 1) this.pos = p.createVector(p.random(W), p.random(H - 30, H + 20));
    else if (edge === 2) this.pos = p.createVector(p.random(-20, 30), p.random(H));
    else this.pos = p.createVector(p.random(W - 30, W + 20), p.random(H));
    this.prev = this.pos.copy(); this.vel = p.createVector(0, 0);
    this.life = Math.floor(p.random(40, 130));
    this.jitter = p.random(0.7, 1.3);
  }
  update(seedOffset, fieldAngle) {
    const p = this.p, pr = this.params;
    const a = fieldAngle(this.pos.x, this.pos.y);
    const sp = pr.flowSpeed * this.jitter;
    this.vel = p.createVector(Math.cos(a), Math.sin(a)).mult(sp * 1.6);
    this.prev = this.pos.copy(); this.pos.add(this.vel);
    this.pos.add(p.createVector(p.width / 2 - this.pos.x, p.height * 0.52 - this.pos.y).mult(0.0011));
    this.life--;
    if (this.life <= 0 || this.pos.x < -30 || this.pos.x > p.width + 30 || this.pos.y < -30 || this.pos.y > p.height + 30) this.respawn(false);
  }
  display() {
    const p = this.p, pr = this.params;
    const v = Math.min(2.2, this.vel.mag());
    const warm = pr.warmthBias / 100;
    const e = fripetHexToRgb(pr.colorPalette[0]), l = fripetHexToRgb(pr.colorPalette[1]), c = fripetHexToRgb(pr.colorPalette[2]);
    p.stroke(
      Math.min(255, Math.round(e.r * warm + l.r * (1 - warm) * 0.55 + c.r * 0.12 * (v / 2.2))),
      Math.min(255, Math.round(e.g * warm * 0.8 + l.g * (1 - warm) * 0.8 + c.g * 0.10 * (v / 2.2))),
      Math.min(255, Math.round(e.b * 0.35 * warm + l.b * (1 - warm) * 0.7 + c.b * 0.10)),
      pr.trailAlpha + v * 10
    );
    p.strokeWeight(1.25);
    p.line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
  }
}

function fripetCreateRenderer(p, params) {
  let seedOffset = (params.seed * 0.137) % 100;
  p.randomSeed(params.seed); p.noiseSeed(params.seed);
  const fieldAngle = (x, y) => {
    const n = p.noise(x * params.noiseScale + seedOffset, y * params.noiseScale - seedOffset);
    return (Math.sin(x * 0.004 * params.fieldScale + seedOffset) + Math.cos(y * 0.0045 * params.fieldScale)) * 1.2 + (n - 0.5) * p.TWO_PI * 1.6;
  };
  // base
  p.background(28, 17, 8); p.noStroke();
  for (let r = 520; r > 0; r -= 26) { p.fill(249, 115, 22, 10 * (1 - r / 520) * 0.55); p.circle(p.width * 0.18, p.height * 0.10, r * 2); }
  for (let r = 460; r > 0; r -= 26) { p.fill(16, 185, 129, 9 * (1 - r / 460) * 0.5); p.circle(p.width * 0.86, p.height * 0.12, r * 2); }
  for (let r = 560; r > 0; r -= 28) { p.fill(124, 45, 18, 12 * (1 - r / 560) * 0.5); p.circle(p.width * 0.5, p.height * 1.08, r * 2); }
  p.fill(255, 231, 189, 19);
  for (let y = 14; y < p.height; y += 28) for (let x = 14; x < p.width; x += 28) p.circle(x, y, 2);
  const hue = FRIPET_SPECIES_HUE[params.species] ?? 30;
  p.colorMode(p.HSB, 360, 100, 100, 255);
  for (let r = 340; r > 0; r -= 22) { p.fill(hue, 62, 96, 5 * (1 - r / 340) + 2); p.circle(p.width / 2, p.height * 0.52, r * 2); }
  p.colorMode(p.RGB, 255);
  const parts = [];
  for (let i = 0; i < params.particleCount; i++) parts.push(new FripetParticle(p, params, true));
  return {
    step(times = 3) { for (let k = 0; k < times; k++) for (const pt of parts) { pt.update(seedOffset, fieldAngle); pt.display(); } },
  };
}

if (typeof module !== 'undefined') module.exports = { FRIPET_DEFAULTS, FRIPET_SPECIES_HUE, FRIPET_PRESETS, fripetCreateRenderer };
