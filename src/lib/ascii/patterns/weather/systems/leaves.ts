import type { WeatherSystem } from '../types';

const COLORS = [
  'rgb(255,165,0)',
  'rgb(218,165,32)',
  'rgb(184,134,11)',
  'rgb(205,92,92)',
  'rgb(160,82,45)',
  'rgb(139,69,19)',
] as const;

const CHAR_PAIRS = [
  ['*', '+'],
  [',', '.'],
  ['~', '-'],
] as const;

const MAX_LEAVES = 15;
const SPAWN_CHANCE = 0.008;

interface Leaf {
  x: number;
  y: number;
  speed: number;
  swayPhase: number;
  swayAmplitude: number;
  color: string;
  charPair: readonly [string, string];
}

export class LeavesSystem implements WeatherSystem {
  private leaves: Leaf[] = [];
  private cols = 0;
  private rows = 0;
  private windX = 0;

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.leaves = [];
  }

  configure(weather: { windSpeed: number; windDirection: number }): void {
    const rad = (weather.windDirection * Math.PI) / 180;
    this.windX = (weather.windSpeed / 30) * -Math.sin(rad);
  }

  update(dt: number): void {
    const s = dt / 1000;

    for (let i = this.leaves.length - 1; i >= 0; i--) {
      const l = this.leaves[i];
      l.y += l.speed * s;
      l.swayPhase += s * 2;
      l.x += Math.sin(l.swayPhase) * l.swayAmplitude * 0.1 * 15 * s;
      l.x += this.windX * s;

      if (l.y > this.rows || l.x < -5 || l.x > this.cols + 5) {
        this.leaves.splice(i, 1);
      }
    }

    if (this.leaves.length < MAX_LEAVES && Math.random() < SPAWN_CHANCE) {
      this.leaves.push({
        x: Math.random() * this.cols,
        y: -1,
        speed: 1.5 + Math.random() * 2,
        swayPhase: Math.random() * Math.PI * 2,
        swayAmplitude: 0.5 + Math.random() * 1.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        charPair: CHAR_PAIRS[Math.floor(Math.random() * CHAR_PAIRS.length)],
      });
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    _cols: number,
    _rows: number,
    charW: number,
    charH: number,
  ): void {
    for (const l of this.leaves) {
      const gx = Math.floor(l.x);
      const gy = Math.floor(l.y);
      if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) continue;

      const rotIdx = Math.floor(Math.abs(Math.sin(l.swayPhase * 2))) as 0 | 1;
      ctx.fillStyle = l.color;
      ctx.fillText(l.charPair[rotIdx], gx * charW, gy * charH);
    }
  }
}
