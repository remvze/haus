import type { WeatherSystem } from '../types';

const DIRECTION_CHANGE_CHANCE = 0.02;

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  glowPhase: number;
  glowSpeed: number;
}

export class FireflySystem implements WeatherSystem {
  private fireflies: Firefly[] = [];
  private cols = 0;
  private rows = 0;

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.fireflies = [];

    const count = Math.max(3, Math.floor(cols / 15));
    const zoneTop = Math.max(0, rows - Math.floor(rows * 0.4));
    const zoneBottom = rows - 2;

    for (let i = 0; i < count; i++) {
      this.fireflies.push({
        x: Math.random() * cols,
        y: zoneTop + Math.random() * (zoneBottom - zoneTop),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        glowPhase: Math.random() * Math.PI * 2,
        glowSpeed: 0.1 + Math.random() * 0.15,
      });
    }
  }

  update(dt: number): void {
    const s = dt / 1000;

    for (const f of this.fireflies) {
      f.glowPhase += f.glowSpeed * dt;

      if (Math.random() < DIRECTION_CHANGE_CHANCE) {
        f.vx = (Math.random() - 0.5) * 0.3;
        f.vy = (Math.random() - 0.5) * 0.2;
      }

      f.x += f.vx * s * 15;
      f.y += f.vy * s * 15;

      if (f.x < 0) f.x = this.cols - 1;
      if (f.x >= this.cols) f.x = 0;
      f.y = Math.max(this.rows * 0.5, Math.min(this.rows - 2, f.y));
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    _cols: number,
    _rows: number,
    charW: number,
    charH: number,
  ): void {
    for (const f of this.fireflies) {
      const brightness = Math.floor(Math.max(0, Math.sin(f.glowPhase)) * 255);
      if (brightness < 64) continue;

      const gx = Math.floor(f.x);
      const gy = Math.floor(f.y);
      if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) continue;

      let ch: string;
      let color: string;

      if (brightness > 200) {
        ch = '*';
        color = 'rgb(190,175,80)';
      } else if (brightness > 128) {
        ch = '.';
        color = 'rgb(160,180,90)';
      } else {
        ch = '\u00B7';
        color = 'rgb(130,160,75)';
      }

      ctx.fillStyle = color;
      ctx.fillText(ch, gx * charW, gy * charH);
    }
  }
}
