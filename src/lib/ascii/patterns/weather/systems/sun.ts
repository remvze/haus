import type { WeatherSystem } from '../types';

const FRAME_INTERVAL = 0.8;

const SUN_FRAMES: string[][] = [
  [
    '      ;   :   ;    ',
    '   .   \\_,!,_/   , ',
    '    `.\'     `.\'    ',
    '     /         \\   ',
    '~ -- :         : --~',
    '     \\         /   ',
    '    ,\'`._   _.\'`.  ',
    '   \'   / `!` \\   ` ',
    '      ;   :   ;    ',
  ],
  [
    '      .   |   .    ',
    '   ;   \\_,|,_/   ; ',
    '    `.\'     `.\'    ',
    '     /         \\   ',
    '~ -- |         | --~',
    '     \\         /   ',
    '    ,\'`._   _.\'`.  ',
    '   ;   / `|` \\   ; ',
    '      .   |   .    ',
  ],
];

export class SunSystem implements WeatherSystem {
  private cols = 0;
  private rows = 0;
  private posX = 0;
  private posY = 0;
  private frameTimer = 0;
  private frameIndex = 0;

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.posX = Math.floor(cols * 0.15);
    this.posY = Math.floor(rows * 0.05);
    this.frameTimer = 0;
    this.frameIndex = 0;
  }

  update(dt: number): void {
    this.frameTimer += dt / 1000;
    if (this.frameTimer >= FRAME_INTERVAL) {
      this.frameTimer -= FRAME_INTERVAL;
      this.frameIndex = (this.frameIndex + 1) % SUN_FRAMES.length;
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    _cols: number,
    _rows: number,
    charW: number,
    charH: number,
  ): void {
    const lines = SUN_FRAMES[this.frameIndex];

    for (let row = 0; row < lines.length; row++) {
      const line = lines[row];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch === ' ') continue;

        const gx = this.posX + col;
        const gy = this.posY + row;
        if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) continue;

        ctx.fillStyle = 'rgb(255,220,80)';
        ctx.fillText(ch, gx * charW, gy * charH);
      }
    }
  }
}
