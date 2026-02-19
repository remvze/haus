import type { AsciiPattern } from '../types';

// --- constants ---

const SPAWN_MARGIN = 0.2;
const SWAY_FREQUENCY = 0.2;
const SWAY_PHASE_RANGE = Math.PI * 2 * 50;
const RESPAWN_Y_MIN = -1;
const RESPAWN_Y_MAX = -3;
const SPEED_CHAR_LOW = 0.33;
const SPEED_CHAR_HIGH = 0.66;

const COLOR_BG = 'rgb(100,100,100)';
const COLOR_FG = 'rgb(220,220,220)';

// --- types ---

export interface SnowConfig {
  density: number;
  speedRange: [number, number];
  swayAmount: number;
  wind: number;
}

interface Flake {
  char: string;
  depth: 0 | 1;
  speedY: number;
  swayAmplitude: number;
  swayOffset: number;
  x: number;
  y: number;
}

// --- defaults ---

const DEFAULT_CONFIG: SnowConfig = {
  density: 0.4,
  speedRange: [1, 4],
  swayAmount: 1,
  wind: 0,
};

// --- helpers ---

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const randomInRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

const charForSpeed = (speedY: number, min: number, max: number): string => {
  const t = (speedY - min) / (max - min);
  if (t < SPEED_CHAR_LOW) return '.';
  if (t > SPEED_CHAR_HIGH) return '*';
  return '+';
};

const createFlake = (
  cols: number,
  rows: number,
  config: SnowConfig,
  initialSpread: boolean,
): Flake => {
  const { speedRange, swayAmount } = config;
  const depth: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
  const mid = (speedRange[0] + speedRange[1]) / 2;

  const speedY =
    depth === 0
      ? randomInRange(speedRange[0], mid)
      : randomInRange(mid, speedRange[1]);

  const swayAmplitude = depth === 0 ? swayAmount * 0.5 : swayAmount;

  const spawnMin = -cols * SPAWN_MARGIN;
  const spawnMax = cols * (1 + SPAWN_MARGIN);

  return {
    char: charForSpeed(speedY, speedRange[0], speedRange[1]),
    depth,
    speedY,
    swayAmplitude,
    swayOffset: Math.random() * SWAY_PHASE_RANGE,
    x: randomInRange(spawnMin, spawnMax),
    y: initialSpread ? randomInRange(0, rows) : randomInRange(RESPAWN_Y_MAX, RESPAWN_Y_MIN),
  };
};

// --- pattern ---

export class SnowPattern implements AsciiPattern {
  private readonly config: SnowConfig;
  private flakes: Flake[] = [];

  constructor(config: Partial<SnowConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  init(cols: number, rows: number): void {
    const count = Math.floor(cols * this.config.density);
    this.flakes = Array.from({ length: count }, () =>
      createFlake(cols, rows, this.config, true),
    );
  }

  update(dt: number): void {
    const s = dt / 1000;
    const { wind } = this.config;

    for (const flake of this.flakes) {
      flake.y += flake.speedY * s;
      flake.x +=
        Math.sin(flake.y * SWAY_FREQUENCY + flake.swayOffset) *
        flake.swayAmplitude *
        s;
      flake.x += wind * s;
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void {
    this.respawnOffscreen(cols, rows);

    for (const flake of this.flakes) {
      const col = Math.floor(flake.x);
      const row = Math.floor(flake.y);
      if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

      ctx.fillStyle = flake.depth === 0 ? COLOR_BG : COLOR_FG;
      ctx.fillText(flake.char, col * charW, row * charH);
    }
  }

  private respawnOffscreen(cols: number, rows: number): void {
    const spawnMin = -cols * SPAWN_MARGIN;
    const spawnMax = cols * (1 + SPAWN_MARGIN);

    for (const flake of this.flakes) {
      if (flake.y <= rows) continue;

      flake.y = randomInRange(RESPAWN_Y_MAX, RESPAWN_Y_MIN);
      flake.x = randomInRange(spawnMin, spawnMax);
    }
  }
}
