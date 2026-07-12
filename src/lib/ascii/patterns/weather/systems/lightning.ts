import type { WeatherSystem } from '../types';

type LightningState = 'idle' | 'strike' | 'flash' | 'fading';

interface BoltSegment {
  x: number;
  y: number;
  char: string;
}

const IDLE_MIN = 1.5;
const IDLE_MAX = 8;
const FADE_DURATION = 0.5;
const BRANCH_CHANCE = 0.2;
const BRANCH_LENGTH = 3;

export class LightningSystem implements WeatherSystem {
  private cols = 0;
  private rows = 0;
  private state: LightningState = 'idle';
  private timer = 0;
  private idleDuration = 0;
  private bolt: BoltSegment[] = [];
  private flashActive = false;

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.state = 'idle';
    this.idleDuration = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
    this.timer = 0;
    this.bolt = [];
    this.flashActive = false;
  }

  update(dt: number): void {
    const s = dt / 1000;
    this.timer += s;
    this.flashActive = false;

    switch (this.state) {
      case 'idle':
        if (this.timer >= this.idleDuration) {
          this.generateBolt();
          this.state = 'flash';
          this.timer = 0;
        }
        break;

      case 'flash':
        this.flashActive = true;
        this.state = 'fading';
        this.timer = 0;
        break;

      case 'fading':
        if (this.timer >= FADE_DURATION) {
          this.bolt = [];
          this.state = 'idle';
          this.timer = 0;
          this.idleDuration = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
        }
        break;
    }
  }

  private generateBolt(): void {
    this.bolt = [];
    let x = 5 + Math.floor(Math.random() * (this.cols - 10));
    const startY = 2;

    for (let y = startY; y < this.rows - 3; y++) {
      const dx = Math.floor(Math.random() * 3) - 1;
      x += dx;
      x = Math.max(1, Math.min(this.cols - 2, x));

      const ch = dx < 0 ? '/' : dx > 0 ? '\\' : '|';
      this.bolt.push({ x, y, char: ch });

      if (Math.random() < BRANCH_CHANCE) {
        const branchDir = dx <= 0 ? 1 : -1;
        let bx = x;
        for (let b = 0; b < BRANCH_LENGTH; b++) {
          bx += branchDir;
          const by = y + b;
          if (bx < 0 || bx >= this.cols || by >= this.rows) break;
          this.bolt.push({
            x: bx,
            y: by,
            char: branchDir < 0 ? '/' : '\\',
          });
        }
      }
    }
  }

  isFlashing(): boolean {
    return this.flashActive;
  }

  render(
    ctx: CanvasRenderingContext2D,
    _cols: number,
    _rows: number,
    charW: number,
    charH: number,
  ): void {
    if (this.bolt.length === 0) return;

    const isFading = this.state === 'fading';
    const alpha = isFading ? Math.max(0, 1 - this.timer / FADE_DURATION) : 1;
    const v = Math.floor(255 * alpha);
    const color = isFading ? `rgb(${v},${v},${Math.floor(v * 0.8)})` : 'rgb(255,255,240)';

    ctx.fillStyle = color;
    for (const seg of this.bolt) {
      ctx.fillText(seg.char, seg.x * charW, seg.y * charH);
    }
  }
}
