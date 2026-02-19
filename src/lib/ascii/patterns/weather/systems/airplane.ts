import type { WeatherSystem } from '../types';

const SPRITE = [
  '           _       ',
  '         -=\\`\\     ',
  '     |\\ ____\\_\\__  ',
  '   -=\\c"""""""  "`)\'',
  '      `~~~~~/ /~~` ',
  '        -==/ /     ',
  "          '-'      ",
];

const SPRITE_COLORS: Record<string, string> = {
  '"': 'rgb(100,200,220)',
  '\\': 'rgb(80,120,200)',
  '_': 'rgb(100,100,110)',
  '~': 'rgb(140,140,150)',
};
const DEFAULT_COLOR = 'rgb(200,200,210)';

const SPAWN_CHANCE = 0.0005;
const COOLDOWN = 30;
const SPEED_MIN = 3;
const SPEED_MAX = 5;

export class AirplaneSystem implements WeatherSystem {
  private cols = 0;
  private rows = 0;
  private x = 0;
  private y = 0;
  private speed = 0;
  private active = false;
  private cooldown = 0;
  private spriteWidth: number;

  constructor() {
    this.spriteWidth = Math.max(...SPRITE.map(l => l.length));
  }

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.active = false;
    this.cooldown = 5 + Math.random() * 10;
  }

  update(dt: number): void {
    const s = dt / 1000;

    if (this.active) {
      this.x += this.speed * s;
      if (this.x > this.cols + 5) {
        this.active = false;
        this.cooldown = COOLDOWN + Math.random() * 15;
      }
      return;
    }

    this.cooldown -= s;
    if (this.cooldown <= 0 && Math.random() < SPAWN_CHANCE) {
      this.x = -this.spriteWidth;
      this.y = 1 + Math.floor(Math.random() * Math.max(1, this.rows * 0.2));
      this.speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
      this.active = true;
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    _cols: number,
    _rows: number,
    charW: number,
    charH: number,
  ): void {
    if (!this.active) return;

    for (let row = 0; row < SPRITE.length; row++) {
      const line = SPRITE[row];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch === ' ') continue;

        const gx = Math.floor(this.x) + col;
        const gy = this.y + row;
        if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) continue;

        ctx.fillStyle = SPRITE_COLORS[ch] ?? DEFAULT_COLOR;
        ctx.fillText(ch, gx * charW, gy * charH);
      }
    }
  }
}
