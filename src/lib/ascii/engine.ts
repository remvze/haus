import type { AsciiPattern } from './types';

const FONT = '16px "Fira Mono", "Consolas", monospace';

export class CanvasEngine {
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private pattern: AsciiPattern | null = null;
  private charW = 0;
  private charH = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;

    this.applyFont();
    const m = this.ctx.measureText('M');
    this.charW = m.width;
    this.charH = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
  }

  setPattern(pattern: AsciiPattern): void {
    this.pattern?.dispose?.();
    const cols = Math.floor(this.canvas.width / this.charW);
    const rows = Math.floor(this.canvas.height / this.charH);
    pattern.init(cols, rows);
    this.pattern = pattern;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.applyFont();

    if (this.pattern) {
      const cols = Math.floor(width / this.charW);
      const rows = Math.floor(height / this.charH);
      this.pattern.init(cols, rows);
    }
  }

  start(): void {
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.animFrameId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.animFrameId !== null) cancelAnimationFrame(this.animFrameId);
  }

  private applyFont(): void {
    this.ctx.font = FONT;
  }

  private onVisibilityChange = (): void => {
    if (!document.hidden) this.lastTime = 0;
  };

  private tick = (timestamp: number): void => {
    const dt = this.lastTime === 0 ? 0 : Math.min(timestamp - this.lastTime, 100);
    this.lastTime = timestamp;

    this.pattern?.update(dt);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.applyFont();

    const cols = Math.floor(this.canvas.width / this.charW);
    const rows = Math.floor(this.canvas.height / this.charH);
    this.pattern?.render(this.ctx, cols, rows, this.charW, this.charH);

    this.animFrameId = requestAnimationFrame(this.tick);
  };
}
