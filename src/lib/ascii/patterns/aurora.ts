import { createNoise3D } from 'simplex-noise';

import type { AsciiPattern } from '../types';

// --- constants ---

const CHARS = ' .:-=+*#%@';
const CHAR_MAX_INDEX = CHARS.length - 1;

const OCTAVES = 3;
const PERSISTENCE = 0.5;
const LACUNARITY = 2.0;

const FALLOFF_EXPONENT = 1.5;

const AURORA_STOPS: [number, number, number][] = [
  [20, 0, 40],
  [60, 20, 120],
  [0, 180, 160],
  [80, 255, 80],
  [220, 50, 180],
];

const MONO_BASE = 40;
const MONO_RANGE = 180;

// --- config ---

export interface AuroraConfig {
  palette: 'aurora' | 'mono';
  scaleX: number;
  scaleY: number;
  speed: number;
  threshold: number;
}

const DEFAULT_AURORA_CONFIG: AuroraConfig = {
  palette: 'aurora',
  scaleX: 0.03,
  scaleY: 0.08,
  speed: 0.4,
  threshold: 0.3,
};

// --- helpers ---

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const lerpColor = (normalized: number): string => {
  const segment = normalized * 4;
  const i = Math.min(Math.floor(segment), 3);
  const f = segment - i;

  const from = AURORA_STOPS[i];
  const to = AURORA_STOPS[i + 1];

  const r = Math.round(lerp(from[0], to[0], f));
  const g = Math.round(lerp(from[1], to[1], f));
  const b = Math.round(lerp(from[2], to[2], f));

  return `rgb(${r},${g},${b})`;
};

const monoColor = (normalized: number): string => {
  const v = Math.floor(normalized * MONO_RANGE + MONO_BASE);
  return `rgb(${v},${v},${v})`;
};

// --- pattern ---

export class AuroraPattern implements AsciiPattern {
  private config: AuroraConfig;
  private noise3D = createNoise3D();
  private time = 0;

  constructor(config: Partial<AuroraConfig> = {}) {
    this.config = { ...DEFAULT_AURORA_CONFIG, ...config };
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
    const { scaleX, scaleY, speed, threshold, palette } = this.config;
    const t = this.time * speed;
    const thresholdInv = 1 / (1 - threshold);
    const colorFn = palette === 'aurora' ? lerpColor : monoColor;

    for (let row = 0; row < rows; row++) {
      const falloff = 1 - Math.pow(row / rows, FALLOFF_EXPONENT);
      const ny = row * scaleY;

      for (let col = 0; col < cols; col++) {
        const raw = this.fractalNoise(col * scaleX, ny, t);
        const value = raw * falloff;

        if (value <= threshold) continue;

        const normalized = Math.min((value - threshold) * thresholdInv, 1);
        const charIndex = Math.floor(normalized * CHAR_MAX_INDEX);
        const char = CHARS[charIndex];

        if (char === ' ') continue;

        ctx.fillStyle = colorFn(normalized);
        ctx.fillText(char, col * charW, (row + 1) * charH);
      }
    }
  }

  private fractalNoise = (x: number, y: number, z: number): number => {
    let value = 0;
    let amp = 1;
    let freq = 1;

    for (let i = 0; i < OCTAVES; i++) {
      value += this.noise3D(x * freq, y * freq, z * freq) * amp;
      amp *= PERSISTENCE;
      freq *= LACUNARITY;
    }

    return (value + 1) / 2;
  };
}
