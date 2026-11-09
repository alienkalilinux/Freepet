'use client';

import { useEffect, useRef } from 'react';

interface FlowFieldProps {
  className?: string;
  seed?: number;
}

type Rgb = [number, number, number];

interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  life: number;
  speed: number;
  color: Rgb;
}

const MAX_FRAMES = 180;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x: number, y: number, seed: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, seed: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function parseColor(value: string, fallback: Rgb): Rgb {
  const hex = value.trim().replace('#', '');
  if (hex.length === 3) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
    ];
  }
  if (hex.length === 6) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  return fallback;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export default function FlowField({ className = '', seed = 7 }: FlowFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const random = mulberry32(seed);
    const seedOffset = (seed * 0.137) % 100;

    let frame = 0;
    let raf = 0;
    let restart = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let ember: Rgb = [185, 95, 61];
    let leaf: Rgb = [111, 139, 87];
    let cream: Rgb = [233, 210, 180];

    const readPalette = () => {
      const styles = getComputedStyle(document.documentElement);
      ember = parseColor(styles.getPropertyValue('--art-ember'), ember);
      leaf = parseColor(styles.getPropertyValue('--art-leaf'), leaf);
      cream = parseColor(styles.getPropertyValue('--art-cream'), cream);
    };

    const fieldAngle = (x: number, y: number) => {
      const scale = 1.35;
      const n = valueNoise(x * 0.004 + seedOffset, y * 0.004 - seedOffset, seed);
      return (
        (Math.sin(x * 0.004 * scale + seedOffset) + Math.cos(y * 0.0045 * scale)) * 1.1 +
        (n - 0.5) * Math.PI * 2 * 1.2
      );
    };

    const respawn = (particle: Particle, anywhere: boolean) => {
      const edge = Math.floor(random() * 4);
      if (!anywhere || edge === 0) {
        particle.x = random() * width;
        particle.y = -10;
      } else if (edge === 1) {
        particle.x = random() * width;
        particle.y = height + 10;
      } else if (edge === 2) {
        particle.x = -10;
        particle.y = random() * height;
      } else {
        particle.x = width + 10;
        particle.y = random() * height;
      }
      particle.px = particle.x;
      particle.py = particle.y;
      particle.life = 40 + Math.floor(random() * 90);
      particle.speed = 0.7 + random() * 0.6;
      const warm = random() < 0.16;
      const t = Math.min(1, Math.max(0, 0.35 + (random() - 0.5) * 0.3));
      particle.color = warm ? mix(cream, [255, 250, 242], 0.25) : mix(ember, leaf, t);
    };

    const step = () => {
      for (const particle of particles) {
        const angle = fieldAngle(particle.x, particle.y);
        const velocity = particle.speed * 1.35;
        particle.px = particle.x;
        particle.py = particle.y;
        particle.x += Math.cos(angle) * velocity;
        particle.y += Math.sin(angle) * velocity;
        particle.x += (width / 2 - particle.x) * 0.0011;
        particle.y += (height * 0.52 - particle.y) * 0.0011;
        particle.life -= 1;

        if (
          particle.life <= 0 ||
          particle.x < -30 ||
          particle.x > width + 30 ||
          particle.y < -30 ||
          particle.y > height + 30
        ) {
          respawn(particle, false);
          continue;
        }

        const speed = Math.hypot(particle.x - particle.px, particle.y - particle.py);
        const alpha = 0.1 + Math.min(0.16, speed * 0.055);
        ctx.strokeStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${alpha})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(particle.px, particle.py);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();
      }
    };

    const drawFrame = () => {
      for (let i = 0; i < 3; i += 1) step();
      frame += 1;
      if (frame < MAX_FRAMES) {
        raf = requestAnimationFrame(drawFrame);
      }
    };

    const init = () => {
      if (restart) cancelAnimationFrame(restart);
      cancelAnimationFrame(raf);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) return;

      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      readPalette();
      const count = Math.round(Math.min(900, Math.max(320, (width * height) / 950)));
      particles = Array.from({ length: count }, () => {
        const particle: Particle = {
          x: 0,
          y: 0,
          px: 0,
          py: 0,
          life: 0,
          speed: 1,
          color: ember,
        };
        respawn(particle, true);
        return particle;
      });
      frame = 0;

      if (reduced) {
        for (let i = 0; i < MAX_FRAMES; i += 1) {
          for (let j = 0; j < 3; j += 1) step();
        }
      } else {
        raf = requestAnimationFrame(drawFrame);
      }
    };

    const scheduleInit = () => {
      cancelAnimationFrame(restart);
      restart = requestAnimationFrame(init);
    };

    readPalette();
    const resizeObserver = new ResizeObserver(scheduleInit);
    resizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(scheduleInit);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    scheduleInit();

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(restart);
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, [seed]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
