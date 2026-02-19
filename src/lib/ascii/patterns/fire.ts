import type { AsciiPattern } from '../types';

// --- config ---

export type FireMode = 'wall' | 'campfire' | 'torch' | 'candles';
export type FirePalette = 'classic' | 'blue' | 'lava' | 'matrix' | 'mono';
export type FireCharset = 'classic' | 'blocks' | 'sparks';

export interface FireConfig {
  charset: FireCharset;
  decay: number; // 0.5–3.0 — higher = shorter flames
  embers: boolean;
  fps: number; // 10–60 — simulation ticks per second
  intensity: number; // 1–10 — fuel heat
  mode: FireMode;
  palette: FirePalette;
  pulse: boolean;
  sparks: boolean;
  thickness: number; // 1–5 — fuel row depth
  turbulence: number; // 1–10 — randomness in decay
  wind: number; // -5–+5 — horizontal drift bias
}

export const DEFAULT_FIRE_CONFIG: FireConfig = {
  charset: 'classic',
  decay: 1,
  embers: true,
  fps: 25,
  intensity: 7,
  mode: 'wall',
  palette: 'classic',
  pulse: false,
  sparks: true,
  thickness: 1,
  turbulence: 5,
  wind: 0,
};

// --- palettes & charsets ---

const PALETTES: Record<Exclude<FirePalette, 'mono'>, readonly string[]> = {
  blue: [
    '#000000',
    '#020a1a',
    '#061a3d',
    '#0a2a5e',
    '#104080',
    '#1860a8',
    '#2088d0',
    '#40b0f0',
    '#80d8ff',
    '#e0f8ff',
  ],
  classic: [
    '#000000',
    '#1a0a02',
    '#3d1206',
    '#5e1a08',
    '#8c2a08',
    '#b84510',
    '#d86a18',
    '#f49922',
    '#ffc844',
    '#fff8dc',
  ],
  lava: [
    '#000000',
    '#1a0000',
    '#3d0404',
    '#600808',
    '#8a1010',
    '#b82020',
    '#e04040',
    '#f08060',
    '#ffc0a0',
    '#ffffff',
  ],
  matrix: [
    '#000000',
    '#001a02',
    '#003d08',
    '#006010',
    '#008820',
    '#10b030',
    '#30d850',
    '#60f080',
    '#a0ffb0',
    '#e0ffe8',
  ],
};

const CHARSETS: Record<FireCharset, string> = {
  blocks: ' ░▒▓█',
  classic: ' .:-=+*#%@',
  sparks: ' .,*+xX#%',
};

const MAX_EMBER_COUNT = 128;
const MAX_SPARK_COUNT = 32;
const PULSE_SPEED = 1.2;

// --- types ---

interface ParticlePool {
  count: number;
  life: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  x: Float32Array;
  y: Float32Array;
}

interface FuelRegion {
  w: number;
  x: number;
}

// --- helpers ---

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const makePool = (max: number): ParticlePool => ({
  count: 0,
  life: new Float32Array(max),
  vx: new Float32Array(max),
  vy: new Float32Array(max),
  x: new Float32Array(max),
  y: new Float32Array(max),
});

// --- pattern ---

export class FirePattern implements AsciiPattern {
  private config: FireConfig;
  private heat = new Float32Array(0);
  private noise = new Float32Array(0);
  private cols = 0;
  private rows = 0;
  private accumulator = 0;
  private pulsePhase = 0;
  private noiseScroll = 0;
  private embers: ParticlePool = makePool(MAX_EMBER_COUNT);
  private sparks: ParticlePool = makePool(MAX_SPARK_COUNT);

  constructor(config: Partial<FireConfig> = {}) {
    this.config = { ...DEFAULT_FIRE_CONFIG, ...config };
  }

  setConfig(patch: Partial<FireConfig>): void {
    this.config = { ...this.config, ...patch };
  }

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.accumulator = 0;
    this.pulsePhase = 0;
    this.noiseScroll = 0;
    this.embers = makePool(MAX_EMBER_COUNT);
    this.sparks = makePool(MAX_SPARK_COUNT);
    this.heat = new Float32Array(cols * rows);
    this.initNoise();
    this.igniteFuelRows();
  }

  update(dt: number): void {
    const intervalMs = 1000 / this.config.fps;
    this.accumulator += dt;

    while (this.accumulator >= intervalMs) {
      if (this.config.pulse)
        this.pulsePhase += PULSE_SPEED * (intervalMs / 1000);
      this.tick();
      this.accumulator -= intervalMs;
    }

    const dtSec = dt / 1000;
    if (this.config.embers) {
      this.spawnEmber();
      this.updateEmbers(dtSec);
    }
    if (this.config.sparks) {
      this.spawnSparks();
      this.updateSparks(dtSec);
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void {
    const charset = CHARSETS[this.config.charset];
    const charLen = charset.length - 1;
    const isMono = this.config.palette === 'mono';
    const palette = isMono
      ? null
      : PALETTES[this.config.palette as Exclude<FirePalette, 'mono'>];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const heat = this.heat[row * this.cols + col];
        if (heat < 0.5) continue;

        const charIdx = Math.min(
          charLen,
          Math.floor((heat * charLen) / 9 + 0.5),
        );
        const char = charset[charIdx];
        if (char === ' ') continue;

        if (isMono) {
          const v = Math.floor(clamp(heat / 10, 0, 1) * 255);
          ctx.fillStyle = `rgb(${v},${v},${v})`;
        } else {
          ctx.fillStyle = palette![Math.min(9, Math.floor(heat))];
        }

        ctx.fillText(char, col * charW, (row + 1) * charH);
      }
    }

    if (this.config.embers) this.renderEmbers(ctx, cols, rows, charW, charH);
    if (this.config.sparks) this.renderSparks(ctx, cols, rows, charW, charH);
  }

  // --- noise ---

  private initNoise(): void {
    const n = this.cols * this.rows;
    this.noise = new Float32Array(n);
    for (let i = 0; i < n; i++) this.noise[i] = 0.3 * Math.random();

    //  2 box-blur passes smooth the noise into organic patches
    const tmp = new Float32Array(n);
    for (let pass = 0; pass < 2; pass++) {
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          let sum = 0;
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const r = row + dr;
              const c = col + dc;
              if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                sum += this.noise[r * this.cols + c];
                count++;
              }
            }
          }
          tmp[row * this.cols + col] = sum / count;
        }
      }
      for (let i = 0; i < n; i++) this.noise[i] = tmp[i];
    }
  }

  // --- fuel regions ---

  private getFuelRegions(): FuelRegion[] {
    const { cols } = this;

    switch (this.config.mode) {
      case 'campfire': {
        const w = 0.3 * cols;
        return [{ w, x: cols / 2 - w / 2 }];
      }
      case 'torch': {
        const count = Math.min(4, Math.max(3, Math.floor(cols / 25)));
        const spacing = cols / (count + 1);
        const w = Math.max(3, 0.06 * cols);
        return Array.from({ length: count }, (_, i) => ({
          w,
          x: spacing * (i + 1) - w / 2,
        }));
      }
      case 'candles': {
        const count = Math.min(8, Math.max(5, Math.floor(cols / 15)));
        const spacing = cols / (count + 1);
        const w = Math.max(2, 0.03 * cols);
        return Array.from({ length: count }, (_, i) => ({
          w,
          x: spacing * (i + 1) - w / 2,
        }));
      }
      default:
        return [{ w: cols, x: 0 }];
    }
  }

  private isInFuelRegion(col: number, regions: FuelRegion[]): boolean {
    for (const r of regions) {
      if (col >= r.x && col < r.x + r.w) return true;
    }
    return false;
  }

  // --- simulation ---

  private tick(): void {
    this.igniteFuelRows();
    this.flameSurges();
    this.propagate();
    this.horizontalSmooth();
  }

  private igniteFuelRows(): void {
    const { intensity, pulse, thickness } = this.config;
    const regions = this.getFuelRegions();
    const pulseMultiplier = pulse ? 0.7 + 0.3 * Math.sin(this.pulsePhase) : 1;
    const safeThickness = Math.min(thickness, this.rows - 2);

    for (let t = 0; t < safeThickness; t++) {
      const row = this.rows - 1 - t;
      for (let col = 0; col < this.cols; col++) {
        const idx = row * this.cols + col;

        if (!this.isInFuelRegion(col, regions)) {
          this.heat[idx] *= 0.3;
          continue;
        }

        const fuel = intensity * (0.6 + 0.4 * Math.random()) * pulseMultiplier;
        const flickerChance = 0.12 / Math.sqrt(safeThickness);
        if (Math.random() < flickerChance) {
          this.heat[idx] *= 0.7;
        } else {
          this.heat[idx] = Math.max(this.heat[idx], fuel);
        }
      }
    }
  }

  private flameSurges(): void {
    const regions = this.getFuelRegions();
    const surgeChance =
      this.config.mode === 'wall'
        ? 1
        : this.config.mode === 'campfire'
          ? 0.5
          : 0.3;
    const surgeCount =
      Math.random() < 0.5 * surgeChance ? 1 + Math.floor(Math.random() * 4) : 0;

    for (let s = 0; s < surgeCount; s++) {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const centerCol = Math.floor(region.x + Math.random() * region.w);
      const height = 4 + Math.floor(Math.random() * 8);
      const maxHeat = 7 + 3 * Math.random();

      for (let h = 0; h < height; h++) {
        const row = this.rows - 2 - this.config.thickness - h;
        if (row < 0) break;

        const halfWidth = 1.5 * Math.sin((h / height) * Math.PI);
        for (let dc = -halfWidth; dc <= halfWidth; dc++) {
          const col = centerCol + Math.round(dc + (Math.random() - 0.5));
          if (col < 0 || col >= this.cols) continue;

          const idx = row * this.cols + col;
          const heatVal =
            maxHeat * (1 - (h / height) * 0.5) * (0.6 + 0.4 * Math.random());
          this.heat[idx] = Math.max(this.heat[idx], heatVal);
        }
      }
    }
  }

  private propagate(): void {
    const { cols, config, heat, noise, rows } = this;
    const fuelBottom = rows - config.thickness;
    const n = cols * rows;
    const rowBuf = new Float32Array(cols);

    this.noiseScroll += 0.02;

    for (let row = 0; row < fuelBottom; row++) {
      const heightFactor = 1 - row / rows;
      rowBuf.fill(0);

      for (let col = 0; col < cols; col++) {
        const below = row + 1;
        if (below >= rows) continue;

        //  Wind shifts source column lookup by wind × height factor
        let srcCol = col;
        if (config.wind !== 0) {
          const drift =
            config.wind * heightFactor * (0.5 + 0.3 * Math.random());
          srcCol = clamp(Math.round(col + drift), 0, cols - 1);
        }

        //  5-neighbor weighted kernel: center 3, ±1 gets 2, ±2 gets 1, row+2 gets 1
        let sum = 0;
        let weight = 0;

        sum += 3 * heat[below * cols + srcCol];
        weight += 3;
        if (srcCol > 0) {
          sum += 2 * heat[below * cols + (srcCol - 1)];
          weight += 2;
        }
        if (srcCol < cols - 1) {
          sum += 2 * heat[below * cols + (srcCol + 1)];
          weight += 2;
        }
        if (srcCol > 1) {
          sum += heat[below * cols + (srcCol - 2)];
          weight += 1;
        }
        if (srcCol < cols - 2) {
          sum += heat[below * cols + (srcCol + 2)];
          weight += 1;
        }
        if (below + 1 < rows) {
          sum += heat[(below + 1) * cols + srcCol];
          weight += 1;
        }

        let h = sum / weight;

        const decayBase = 0.2 * config.decay;
        const noiseIdx =
          ((row + Math.floor(10 * this.noiseScroll)) % rows) * cols + col;
        h -=
          decayBase *
          (0.6 + noise[Math.abs(noiseIdx) % n] + 0.4 * Math.random());

        h += (Math.random() - 0.5) * heightFactor * config.turbulence * 0.12;

        rowBuf[col] = clamp(h, 0, 10);
      }

      for (let col = 0; col < cols; col++) {
        heat[row * cols + col] = rowBuf[col];
      }
    }
  }

  private horizontalSmooth(): void {
    const { cols, heat, rows } = this;
    const start = Math.max(0, rows - 8);

    for (let row = start; row < rows - 1; row++) {
      for (let col = 1; col < cols - 1; col++) {
        const idx = row * cols + col;
        heat[idx] = 0.85 * heat[idx] + 0.075 * (heat[idx - 1] + heat[idx + 1]);
      }
    }
  }

  // --- embers (SoA) ---

  private spawnEmber(): void {
    const { config, embers, rows } = this;
    if (embers.count >= MAX_EMBER_COUNT || rows < 3) return;

    const regions = this.getFuelRegions();
    const chance = 0.12 + 0.02 * config.thickness + 0.01 * config.intensity;
    if (Math.random() >= chance) return;

    const region = regions[Math.floor(Math.random() * regions.length)];
    const i = embers.count++;
    embers.x[i] = region.x + Math.random() * region.w;
    embers.y[i] = rows - config.thickness - 1 - 3 * Math.random();
    embers.life[i] = 0.8 + 1.5 * Math.random();
    embers.vx[i] = 0.2 * (Math.random() - 0.5) - 0.08 * config.wind;
    embers.vy[i] = -0.3 - 0.2 * Math.random();
  }

  private updateEmbers(dtSec: number): void {
    const { cols, config, embers } = this;
    if (embers.count === 0) return;

    let alive = 0;
    for (let i = 0; i < embers.count; i++) {
      embers.life[i] -= dtSec;
      if (embers.life[i] <= 0) continue;

      embers.x[i] += embers.vx[i] * dtSec * 30;
      embers.y[i] += embers.vy[i] * dtSec * 30;
      embers.vx[i] += 0.5 * (Math.random() - 0.5) - 0.02 * config.wind;
      embers.vy[i] -= 0.05;

      // Clamp velocities to prevent excessive speed
      embers.vx[i] = clamp(embers.vx[i], -1.5, 1.5);
      embers.vy[i] = clamp(embers.vy[i], -1.5, 0.5);

      if (embers.y[i] < 0 || embers.x[i] < 0 || embers.x[i] >= cols) continue;

      //  Compact-remove: swap live entries to front, no .filter() allocation
      if (alive !== i) {
        embers.x[alive] = embers.x[i];
        embers.y[alive] = embers.y[i];
        embers.vx[alive] = embers.vx[i];
        embers.vy[alive] = embers.vy[i];
        embers.life[alive] = embers.life[i];
      }
      alive++;
    }
    embers.count = alive;
  }

  private renderEmbers(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void {
    const { config, embers } = this;
    const isMono = config.palette === 'mono';
    const palette = isMono
      ? null
      : PALETTES[config.palette as Exclude<FirePalette, 'mono'>];

    for (let i = 0; i < embers.count; i++) {
      const col = Math.floor(embers.x[i]);
      const row = Math.floor(embers.y[i]);
      if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

      const char = embers.life[i] > 0.3 ? '*' : '.';
      if (isMono) {
        const v = Math.floor((embers.life[i] > 0.5 ? 1 : 0.7) * 255);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
      } else {
        ctx.fillStyle = palette![embers.life[i] > 0.5 ? 9 : 7];
      }
      ctx.fillText(char, col * charW, (row + 1) * charH);
    }
  }

  // --- sparks (SoA) ---

  private spawnSparks(): void {
    const { config, rows, sparks } = this;
    if (sparks.count >= MAX_SPARK_COUNT || rows < 3) return;

    const regions = this.getFuelRegions();
    const chance = 0.25 + 0.03 * config.intensity;
    if (Math.random() >= chance) return;

    const burstCount = 1 + Math.floor(Math.random() * 3);
    for (let b = 0; b < burstCount && sparks.count < MAX_SPARK_COUNT; b++) {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const i = sparks.count++;
      sparks.x[i] = region.x + Math.random() * region.w;
      sparks.y[i] = rows - config.thickness - 2 - 2 * Math.random();
      sparks.life[i] = 0.25 + 0.35 * Math.random();
      sparks.vx[i] = 3 * (Math.random() - 0.5) - 0.15 * config.wind;
      sparks.vy[i] = -0.5 - 1.5 * Math.random();
    }
  }

  private updateSparks(dtSec: number): void {
    const { cols, config, sparks } = this;
    if (sparks.count === 0) return;

    let alive = 0;
    for (let i = 0; i < sparks.count; i++) {
      sparks.life[i] -= dtSec;
      if (sparks.life[i] <= 0) continue;

      sparks.x[i] += sparks.vx[i] * dtSec * 30;
      sparks.y[i] += sparks.vy[i] * dtSec * 30;
      sparks.vx[i] += 2 * (Math.random() - 0.5) - 0.05 * config.wind;
      sparks.vy[i] += 0.3;

      if (sparks.y[i] < 0 || sparks.x[i] < 0 || sparks.x[i] >= cols) continue;

      if (alive !== i) {
        sparks.x[alive] = sparks.x[i];
        sparks.y[alive] = sparks.y[i];
        sparks.vx[alive] = sparks.vx[i];
        sparks.vy[alive] = sparks.vy[i];
        sparks.life[alive] = sparks.life[i];
      }
      alive++;
    }
    sparks.count = alive;
  }

  private renderSparks(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void {
    const { config, sparks } = this;
    const isMono = config.palette === 'mono';
    const palette = isMono
      ? null
      : PALETTES[config.palette as Exclude<FirePalette, 'mono'>];

    for (let i = 0; i < sparks.count; i++) {
      const col = Math.floor(sparks.x[i]);
      const row = Math.floor(sparks.y[i]);
      if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

      if (isMono) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = palette![9];
      }
      ctx.fillText("'", col * charW, (row + 1) * charH);
    }
  }
}
