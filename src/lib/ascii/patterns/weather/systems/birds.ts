import type { WeatherSystem } from '../types';

const MAX_BIRDS = 3;
const SPAWN_CHANCE = 0.005;
const FLAP_INTERVAL = 0.15;

interface Bird {
  x: number;
  y: number;
  speed: number;
  flapTimer: number;
  wingsUp: boolean;
}

export class BirdSystem implements WeatherSystem {
  private birds: Bird[] = [];
  private cols = 0;
  private rows = 0;

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.birds = [];
  }

  update(dt: number): void {
    const s = dt / 1000;

    for (let i = this.birds.length - 1; i >= 0; i--) {
      const b = this.birds[i];
      b.x += b.speed * s;
      b.flapTimer += s;

      if (b.flapTimer >= FLAP_INTERVAL) {
        b.flapTimer -= FLAP_INTERVAL;
        b.wingsUp = !b.wingsUp;
      }

      if (b.x > this.cols + 3) {
        this.birds.splice(i, 1);
      }
    }

    if (this.birds.length < MAX_BIRDS && Math.random() < SPAWN_CHANCE) {
      this.birds.push({
        x: -2,
        y: 2 + Math.floor(Math.random() * (this.rows * 0.3)),
        speed: 2 + Math.random() * 2,
        flapTimer: 0,
        wingsUp: true,
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
    ctx.fillStyle = 'rgb(200,180,60)';
    for (const b of this.birds) {
      const gx = Math.floor(b.x);
      const gy = Math.floor(b.y);
      if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) continue;

      ctx.fillText(b.wingsUp ? 'v' : '-', gx * charW, gy * charH);
    }
  }
}
