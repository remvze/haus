import type { WeatherSystem } from '../types';

const DENSITY_DIVISOR = 80;
const MIN_SPACING = 3;
const PLACEMENT_ATTEMPTS = 50;
const TWINKLE_SPEED = 3;
const SHOOTING_STAR_CHANCE = 0.003;
const TRAIL_LENGTH = 5;

interface Star {
  x: number;
  y: number;
  phase: number;
  phaseSpeed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  life: number;
}

export class StarsSystem implements WeatherSystem {
  private stars: Star[] = [];
  private shootingStars: ShootingStar[] = [];
  private cols = 0;
  private rows = 0;

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.stars = [];
    this.shootingStars = [];

    const count = Math.floor((cols * rows) / DENSITY_DIVISOR);
    const halfRows = Math.floor(rows / 2);

    for (let i = 0; i < count; i++) {
      let placed = false;
      for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt++) {
        const x = Math.random() * cols;
        const y = Math.random() * halfRows;

        const tooClose = this.stars.some(
          s => Math.abs(s.x - x) + Math.abs(s.y - y) < MIN_SPACING,
        );

        if (!tooClose) {
          this.stars.push({
            x,
            y,
            phase: Math.random() * Math.PI * 2,
            phaseSpeed: 0.8 + Math.random() * 0.4,
          });
          placed = true;
          break;
        }
      }

      if (!placed) {
        this.stars.push({
          x: Math.random() * cols,
          y: Math.random() * halfRows,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.8 + Math.random() * 0.4,
        });
      }
    }
  }

  update(dt: number): void {
    const s = dt / 1000;

    for (const star of this.stars) {
      star.phase += TWINKLE_SPEED * star.phaseSpeed * s;
    }

    if (Math.random() < SHOOTING_STAR_CHANCE) {
      this.shootingStars.push({
        x: Math.random() * this.cols,
        y: Math.random() * (this.rows * 0.3),
        vx: (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 20),
        vy: 8 + Math.random() * 8,
        trail: [],
        life: 1,
      });
    }

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.trail.unshift({ x: ss.x, y: ss.y });
      if (ss.trail.length > TRAIL_LENGTH) ss.trail.pop();
      ss.x += ss.vx * s;
      ss.y += ss.vy * s;
      ss.life -= s * 2;

      if (ss.life <= 0 || ss.x < -5 || ss.x > this.cols + 5 || ss.y > this.rows) {
        this.shootingStars.splice(i, 1);
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    _cols: number,
    _rows: number,
    charW: number,
    charH: number,
  ): void {
    for (const star of this.stars) {
      const brightness = (Math.sin(star.phase) + 1) / 2;
      const ch = brightness > 0.8 ? '*' : brightness > 0.4 ? '+' : '.';
      const v = brightness > 0.6 ? 200 : 100;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillText(ch, Math.floor(star.x) * charW, Math.floor(star.y) * charH);
    }

    for (const ss of this.shootingStars) {
      ctx.fillStyle = 'rgb(200,200,220)';
      ctx.fillText('*', Math.floor(ss.x) * charW, Math.floor(ss.y) * charH);

      for (let i = 0; i < ss.trail.length; i++) {
        const t = ss.trail[i];
        const ch = i === 0 ? '+' : '.';
        const v = Math.floor(180 - i * 30);
        ctx.fillStyle = `rgb(${v},${v},${Math.min(255, v + 30)})`;
        ctx.fillText(ch, Math.floor(t.x) * charW, Math.floor(t.y) * charH);
      }
    }
  }
}
