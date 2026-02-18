import type { AsciiPattern } from '../types';

// --- constants ---

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF';

const TRAIL_DECAY_PER_SECOND = 0.05;  // how fast the alpha trail fades (lower = longer trail)
const SPLASH_DECAY_PER_SECOND = 2.8;  // splashes fade faster than trail
const SPLASH_GRAVITY = 5;             // rows/sec² pulling splash particles downward
const IMPACT_FRAMES = 3;              // frames the '*' flash is visible at the hit point
const ALPHA_CUTOFF = 0.05;            // below this alpha, cells are skipped entirely
const SPLASH_CHAR_THRESHOLD = 0.4;    // above this alpha, use heavy directional char; below, use light

// --- types ---

interface Column {
  hitBottom: boolean;
  length: number;
  speed: number;
  y: number;
}

interface Splash {
  alpha: number;
  col: number;
  heavyChar: string;
  lightChar: string;
  row: number;
  vCol: number;
  vRow: number;
}

interface Impact {
  col: number;
  framesLeft: number;
  row: number;
}

// --- helpers ---

// [AI] Encodes brightness as grey RGB so the trail shifts from white → dark grey,
// rather than becoming transparent against the background.
const greyColor = (alpha: number): string => {
  const v = Math.floor(alpha * 255);
  return `rgb(${v},${v},${v})`;
};

// [AI] Directional chars based on horizontal velocity — angled particles read as a fan,
// not a scattered pile of dots.
const splashCharsFor = (vCol: number): { heavy: string; light: string } => {
  if (vCol < -0.8) return { heavy: '\\', light: ',' };
  if (vCol > 0.8) return { heavy: '/', light: '.' };
  return { heavy: '|', light: "'" };
};

// --- pattern ---

export class RainPattern implements AsciiPattern {
  private cols = 0;
  private rows = 0;
  private columns: Column[] = [];
  private alpha: Float32Array[] = [];
  private chars: Uint8Array[] = [];
  private splashes: Splash[] = [];
  private impacts: Impact[] = [];

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.splashes = [];
    this.impacts = [];
    this.columns = Array.from({ length: cols }, () => this.makeColumn(true));
    this.alpha = Array.from({ length: rows }, () => new Float32Array(cols));
    this.chars = Array.from({ length: rows }, () => new Uint8Array(cols));
  }

  update(dt: number): void {
    const dtSec = dt / 1000;

    this.updateColumns(dtSec);
    this.updateSplashes(dtSec);
    this.updateImpacts();
  }

  render(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void {
    this.renderTrail(ctx, cols, rows, charW, charH);
    this.renderImpacts(ctx, charW, charH);
    this.renderSplashes(ctx, cols, rows, charW, charH);
  }

  // [AI] init=true: wide stagger so drops arrive gradually across a large off-screen range.
  // init=false (reset): short stagger so the column refills without a visible gap.
  private makeColumn(init = false): Column {
    return {
      hitBottom: false,
      length: Math.random() * 15 + 5,
      speed: Math.random() * 2 + 1,
      y: init
        ? -(Math.random() * this.rows * 4)
        : -(Math.random() * this.rows * 0.5),
    };
  }

  private spawnSplash(col: number): void {
    this.impacts.push({ col, framesLeft: IMPACT_FRAMES, row: this.rows - 1 });

    const count = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < count; i++) {
      const vCol = (Math.random() - 0.5) * 6;
      const { heavy, light } = splashCharsFor(vCol);
      this.splashes.push({
        alpha: 0.75 + Math.random() * 0.25,
        col: col + (Math.random() - 0.5),
        heavyChar: heavy,
        lightChar: light,
        row: this.rows - 1,
        vCol,
        vRow: -(Math.random() * 5 + 2),
      });
    }
  }

  private updateColumns(dtSec: number): void {
    const decayFactor = TRAIL_DECAY_PER_SECOND ** dtSec;

    for (let col = 0; col < this.cols; col++) {
      const column = this.columns[col];
      column.y += column.speed * dtSec;

      for (let row = 0; row < this.rows; row++) {
        this.alpha[row][col] *= decayFactor;
      }

      const head = Math.floor(column.y);
      if (head >= 0 && head < this.rows) {
        this.alpha[head][col] = 1.0;
        this.chars[head][col] = Math.floor(Math.random() * CHARS.length);
      }

      if (!column.hitBottom && head >= this.rows - 1) {
        column.hitBottom = true;
        this.spawnSplash(col);
      }

      if (column.y > this.rows + column.length) {
        this.columns[col] = this.makeColumn();
      }
    }
  }

  private updateSplashes(dtSec: number): void {
    const decayAmount = SPLASH_DECAY_PER_SECOND * dtSec;

    for (const s of this.splashes) {
      s.col += s.vCol * dtSec;
      s.row += s.vRow * dtSec;
      s.vRow += SPLASH_GRAVITY * dtSec;
      s.alpha -= decayAmount;
    }

    this.splashes = this.splashes.filter(s => s.alpha > ALPHA_CUTOFF && s.row < this.rows);
  }

  private updateImpacts(): void {
    for (const impact of this.impacts) impact.framesLeft--;
    this.impacts = this.impacts.filter(i => i.framesLeft > 0);
  }

  private renderTrail(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellAlpha = this.alpha[row][col];
        if (cellAlpha < ALPHA_CUTOFF) continue;

        const isHead = Math.floor(this.columns[col].y) === row;
        ctx.fillStyle = greyColor(isHead ? 1.0 : cellAlpha);
        ctx.fillText(CHARS.charAt(this.chars[row][col]), col * charW, (row + 1) * charH);
      }
    }
  }

  private renderImpacts(
    ctx: CanvasRenderingContext2D,
    charW: number,
    charH: number,
  ): void {
    for (const impact of this.impacts) {
      ctx.fillStyle = greyColor(impact.framesLeft / IMPACT_FRAMES);
      ctx.fillText('*', impact.col * charW, (impact.row + 1) * charH);
    }
  }

  private renderSplashes(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void {
    for (const s of this.splashes) {
      const col = Math.round(s.col);
      const row = Math.round(s.row);
      if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

      const char = s.alpha > SPLASH_CHAR_THRESHOLD ? s.heavyChar : s.lightChar;
      ctx.fillStyle = greyColor(s.alpha);
      ctx.fillText(char, col * charW, (row + 1) * charH);
    }
  }
}
