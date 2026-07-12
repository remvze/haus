import type { WeatherSystem } from '../types';

const CHARS = ['.', ',', '-', '~'] as const;
const COLORS = ['rgb(120,120,120)', 'rgb(90,90,95)', 'rgb(70,70,75)'] as const;

interface Wisp {
  x: number;
  y: number;
  speed: number;
  char: string;
  color: string;
  life: number;
  maxLife: number;
}

const MAX_WISPS = 80;
const SPAWN_RATE = 0.05;

export class FogSystem implements WeatherSystem {
  private wisps: Wisp[] = [];
  private cols = 0;
  private rows = 0;
  private zoneTop = 0;
  private zoneBottom = 0;

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.zoneTop = Math.max(0, rows - 20);
    this.zoneBottom = Math.max(0, rows - 3);
    this.wisps = [];
  }

  update(dt: number): void {
    const s = dt / 1000;

    for (let i = this.wisps.length - 1; i >= 0; i--) {
      const w = this.wisps[i];
      w.x += w.speed * s;
      w.life -= s;

      if (w.life <= 0 || w.x < -3 || w.x > this.cols + 3) {
        this.wisps.splice(i, 1);
      }
    }

    if (this.wisps.length < MAX_WISPS && Math.random() < SPAWN_RATE) {
      const fromLeft = Math.random() > 0.5;
      this.wisps.push({
        x: fromLeft ? -1 : this.cols,
        y: this.zoneTop + Math.random() * (this.zoneBottom - this.zoneTop),
        speed: (fromLeft ? 1 : -1) * (0.3 + Math.random() * 0.6),
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 5 + Math.random() * 10,
        maxLife: 0,
      });
      this.wisps[this.wisps.length - 1].maxLife = this.wisps[this.wisps.length - 1].life;
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    _cols: number,
    _rows: number,
    charW: number,
    charH: number,
  ): void {
    for (const w of this.wisps) {
      const gx = Math.floor(w.x);
      const gy = Math.floor(w.y);
      if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) continue;

      ctx.fillStyle = w.color;
      ctx.fillText(w.char, gx * charW, gy * charH);
    }
  }
}
