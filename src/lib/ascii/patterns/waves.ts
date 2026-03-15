import { createNoise3D } from 'simplex-noise';

import type { AsciiPattern } from '../types';

// --- constants ---

const CHAR_TIERS: readonly [number, string, string][] = [
  [0.75, '~', '^'],
  [0.55, '~', '≈'],
  [0.35, '-', '='],
  [0.15, '░', '▒'],
];

const FALLBACK_CHARS: [string, string] = ['.', ' '];

const OCEAN_COLORS: readonly [number, string][] = [
  [0.75, 'rgb(230,240,255)'],
  [0.55, 'rgb(100,180,255)'],
  [0.35, 'rgb(40,100,200)'],
  [0.15, 'rgb(20,50,120)'],
];

const OCEAN_COLOR_DARK = 'rgb(10,20,40)';

const MONO_BASE = 30;
const MONO_RANGE = 200;

// --- config ---

export interface WaveConfig {
  amplitude: number;
  choppiness: number;
  frequency: number;
  palette: 'ocean' | 'mono';
  speed: number;
}

const DEFAULT_WAVE_CONFIG: WaveConfig = {
  amplitude: 0.8,
  choppiness: 0.3,
  frequency: 1.5,
  palette: 'ocean',
  speed: 1.0,
};

// --- helpers ---

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const pickChar = (col: number, row: number, a: string, b: string): string =>
  (col + row * 7) % 2 === 0 ? a : b;

const oceanColor = (value: number): string => {
  for (const [threshold, color] of OCEAN_COLORS) {
    if (value > threshold) return color;
  }
  return OCEAN_COLOR_DARK;
};

const monoColor = (value: number): string => {
  const v = Math.floor(value * MONO_RANGE + MONO_BASE);
  return `rgb(${v},${v},${v})`;
};

// --- pattern ---

export class WavePattern implements AsciiPattern {
  private config: WaveConfig;
  private noise3D = createNoise3D();
  private time = 0;

  constructor(config: Partial<WaveConfig> = {}) {
    this.config = { ...DEFAULT_WAVE_CONFIG, ...config };
  }

  init(_cols: number, _rows: number): void {
    this.time = 0;
    this.noise3D = createNoise3D();
  }

  update(dt: number): void {
    this.time += dt / 1000;
  }

  render(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void {
    const { amplitude, speed, frequency, choppiness, palette } = this.config;
    const t = this.time;
    const noise3D = this.noise3D;
    const maxH = 2.1 * amplitude + choppiness;
    const range = 2 * maxH;
    const isMono = palette === 'mono';

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col / cols;
        const y = row / rows;

        const h =
          Math.sin(x * frequency * Math.PI * 2 + t * speed) * amplitude +
          Math.sin(x * frequency * 1.5 * Math.PI * 2 + t * speed * 1.3) * amplitude * 0.5 +
          Math.sin(x * frequency * 2.5 * Math.PI * 2 + t * speed * 0.7) * amplitude * 0.3 +
          noise3D(x * 3, y * 3, t * 0.5) * choppiness +
          Math.sin(y * 3 + t) * amplitude * 0.3;

        const value = clamp((h + maxH) / range, 0, 1);

        let char = pickChar(col, row, FALLBACK_CHARS[0], FALLBACK_CHARS[1]);
        for (const [threshold, a, b] of CHAR_TIERS) {
          if (value > threshold) {
            char = pickChar(col, row, a, b);
            break;
          }
        }

        if (char === ' ') continue;

        ctx.fillStyle = isMono ? monoColor(value) : oceanColor(value);
        ctx.fillText(char, col * charW, row * charH);
      }
    }
  }
}
