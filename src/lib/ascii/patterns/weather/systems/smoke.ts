import type { WeatherCondition, WeatherData, WeatherSystem } from '../types';
import { getChimneyPosition } from './scene';

// --- Constants ---
const MAX_PARTICLES = 30;
const SPAWN_INTERVAL = 0.5;
const BASE_VY = -0.5;
const VY_VARIANCE = 0.3;
const VX_RANGE = 0.3;
const VX_OFFSET = 0.15;
const COLOR_BASE = 200;
const COLOR_DECAY = 50;
const MIN_COLOR = 60;

//  Age thresholds in seconds for character transitions
const AGE_BLOB = 0.5;
const AGE_DOT = 1.0;
const AGE_WAVE = 1.5;

const MAX_AGE_MIN = 2.0;
const MAX_AGE_VARIANCE = 1.0;

const SUPPRESSING_CONDITIONS: ReadonlySet<WeatherCondition> = new Set([
  'rain',
  'heavy-rain',
  'drizzle',
  'thunderstorm',
]);

// --- Particle ---

interface SmokeParticle {
  age: number;
  maxAge: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

const createParticle = (cx: number, cy: number): SmokeParticle => ({
  age: 0,
  maxAge: MAX_AGE_MIN + Math.random() * MAX_AGE_VARIANCE,
  vx: Math.random() * VX_RANGE - VX_OFFSET,
  vy: BASE_VY - Math.random() * VY_VARIANCE,
  x: cx + (Math.random() - 0.5) * 2,
  y: cy,
});

const getChar = (age: number): string => {
  if (age < AGE_BLOB) return 'o';
  if (age < AGE_DOT) return '.';
  if (age < AGE_WAVE) return '~';
  return '\u00B7';
};

const getColor = (age: number): string => {
  const v = Math.max(MIN_COLOR, Math.floor(COLOR_BASE - age * COLOR_DECAY));
  return `rgb(${v},${v},${v})`;
};

// --- System ---

export class SmokeSystem implements WeatherSystem {
  private particles: SmokeParticle[] = [];
  private spawnTimer = 0;
  private cols = 0;
  private rows = 0;
  private suppressed = false;

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.particles = [];
    this.spawnTimer = 0;
  }

  configure(weather: WeatherData): void {
    this.suppressed = SUPPRESSING_CONDITIONS.has(weather.condition);
  }

  update(dt: number): void {
    const s = dt / 1000;
    const { x: cx, y: cy } = getChimneyPosition(this.cols, this.rows);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += s;
      p.x += p.vx * s;
      p.y += p.vy * s;

      if (p.age >= p.maxAge || p.y < 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.suppressed) return;

    this.spawnTimer += s;
    if (
      this.spawnTimer >= SPAWN_INTERVAL &&
      this.particles.length < MAX_PARTICLES
    ) {
      this.spawnTimer -= SPAWN_INTERVAL;
      this.particles.push(createParticle(cx, cy));
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    _cols: number,
    _rows: number,
    charW: number,
    charH: number,
  ): void {
    for (const p of this.particles) {
      const gx = Math.floor(p.x);
      const gy = Math.floor(p.y);
      if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) continue;

      ctx.fillStyle = getColor(p.age);
      ctx.fillText(getChar(p.age), gx * charW, gy * charH);
    }
  }
}
