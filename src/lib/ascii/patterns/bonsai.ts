import type { AsciiPattern } from '../types';

// --- constants ---

const FADE_DURATION = 2;
const LEAF_CHAR = '&';
const LEAF_LIFE_THRESHOLD = 4;
const TRUNK_FORK_CHANCE = 0.125;
const TRUNK_FORK_MIN_LIFE = 7;
const SHOOT_SPAWN_CHANCE = 0.33;
const COOLDOWN_MULTIPLIER = 2;

// --- config ---

export interface BonsaiConfig {
  growthSpeed: number;
  holdDuration: number;
  leafColor: string;
  life: number;
  multiplier: number;
  trunkColor: string;
}

export const DEFAULT_BONSAI_CONFIG: BonsaiConfig = {
  growthSpeed: 33,
  holdDuration: 45,
  leafColor: '#4a9e4a',
  life: 32,
  multiplier: 5,
  trunkColor: '#8b6914',
};

// --- types ---

const enum BranchType {
  trunk = 0,
  shootLeft = 1,
  shootRight = 2,
  dying = 3,
  dead = 4,
}

const enum Phase {
  growing = 0,
  holding = 1,
  fade = 2,
  regrow = 3,
}

interface Branch {
  age: number;
  dx: number;
  dy: number;
  life: number;
  shootCooldown: number;
  type: BranchType;
  x: number;
  y: number;
}

interface Cell {
  char: string;
  color: string;
}

// --- helpers ---

const pickRandom = (chars: string): string =>
  chars[Math.floor(Math.random() * chars.length)];

const weightedPick = (options: readonly [number, number][]): number => {
  const roll = Math.floor(Math.random() * options.reduce((s, o) => s + o[0], 0));
  let acc = 0;
  for (const [weight, value] of options) {
    acc += weight;
    if (roll < acc) return value;
  }
  return options[options.length - 1][1];
};

// --- direction weights (d10/d15 tables from cbonsai) ---

const TRUNK_YOUNG_DX: readonly [number, number][] = [
  [1, -2], [3, -1], [2, 0], [3, 1], [1, 2],
];

const TRUNK_MATURE_DY: readonly [number, number][] = [
  [7, -1], [3, 0],
];

const SHOOT_LEFT_DY: readonly [number, number][] = [
  [2, -1], [6, 0], [2, 1],
];

const SHOOT_LEFT_DX: readonly [number, number][] = [
  [2, -2], [4, -1], [3, 0], [1, 1],
];

const SHOOT_RIGHT_DY: readonly [number, number][] = [
  [2, -1], [6, 0], [2, 1],
];

const SHOOT_RIGHT_DX: readonly [number, number][] = [
  [2, 2], [4, 1], [3, 0], [1, -1],
];

const DYING_DY: readonly [number, number][] = [
  [2, -1], [7, 0], [1, 1],
];

const DYING_DX: readonly [number, number][] = [
  [1, -3], [2, -2], [3, -1], [3, 0], [3, 1], [2, 2], [1, 3],
];

const DEAD_DY: readonly [number, number][] = [
  [3, -1], [4, 0], [3, 1],
];

const getDeltas = (branch: Branch, multiplier: number): { dx: number; dy: number } => {
  switch (branch.type) {
    case BranchType.trunk: {
      if (branch.age < multiplier * 3) {
        const step = Math.floor(multiplier * 0.5);
        const dy = step > 0 && branch.age % step === 0 ? -1 : 0;
        const dx = weightedPick(TRUNK_YOUNG_DX);
        return { dx, dy };
      }
      const dy = weightedPick(TRUNK_MATURE_DY);
      const dx = Math.floor(Math.random() * 3) - 1;
      return { dx, dy };
    }
    case BranchType.shootLeft:
      return { dx: weightedPick(SHOOT_LEFT_DX), dy: weightedPick(SHOOT_LEFT_DY) };
    case BranchType.shootRight:
      return { dx: weightedPick(SHOOT_RIGHT_DX), dy: weightedPick(SHOOT_RIGHT_DY) };
    case BranchType.dying:
      return { dx: weightedPick(DYING_DX), dy: weightedPick(DYING_DY) };
    case BranchType.dead:
      return { dx: Math.floor(Math.random() * 3) - 1, dy: weightedPick(DEAD_DY) };
  }
};

const getChar = (
  type: BranchType,
  dx: number,
  dy: number,
  life: number,
  leafColor: string,
  trunkColor: string,
): { char: string; color: string } => {
  if (life < LEAF_LIFE_THRESHOLD || type >= BranchType.dying) {
    return { char: LEAF_CHAR, color: leafColor };
  }

  let chars: string;

  if (type === BranchType.trunk) {
    if (dy === 0) chars = '/~';
    else if (dx < 0) chars = '\\|';
    else if (dx === 0) chars = '/|\\';
    else chars = '|/';
  } else if (type === BranchType.shootLeft) {
    if (dy > 0) chars = '\\';
    else if (dy === 0) chars = '\\_';
    else if (dx < 0) chars = '\\|';
    else if (dx === 0) chars = '/|';
    else chars = '/';
  } else {
    if (dy > 0) chars = '/';
    else if (dy === 0) chars = '_/';
    else if (dx < 0) chars = '\\|';
    else if (dx === 0) chars = '/|';
    else chars = '/';
  }

  return { char: pickRandom(chars), color: trunkColor };
};

// --- pattern ---

export class BonsaiPattern implements AsciiPattern {
  private config: BonsaiConfig;
  private cols = 0;
  private rows = 0;
  private grid: (Cell | null)[][] = [];
  private queue: Branch[] = [];
  private accumulator = 0;
  private phase: Phase = Phase.growing;
  private phaseTimer = 0;
  private fadeAlpha = 1;
  private nextShootSide: BranchType.shootLeft | BranchType.shootRight = BranchType.shootLeft;

  constructor(config: Partial<BonsaiConfig> = {}) {
    this.config = { ...DEFAULT_BONSAI_CONFIG, ...config };
  }

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.accumulator = 0;
    this.phase = Phase.growing;
    this.phaseTimer = 0;
    this.fadeAlpha = 1;
    this.seedTree();
  }

  update(dt: number): void {
    const dtSec = dt / 1000;

    switch (this.phase) {
      case Phase.growing: {
        this.accumulator += dt;
        const stepInterval = 1000 / this.config.growthSpeed;

        while (this.accumulator >= stepInterval) {
          this.accumulator -= stepInterval;
          this.processStep();
        }

        if (this.queue.length === 0) {
          this.phase = Phase.holding;
          this.phaseTimer = 0;
        }
        break;
      }
      case Phase.holding: {
        this.phaseTimer += dtSec;
        if (this.phaseTimer >= this.config.holdDuration) {
          this.phase = Phase.fade;
          this.phaseTimer = 0;
          this.fadeAlpha = 1;
        }
        break;
      }
      case Phase.fade: {
        this.phaseTimer += dtSec;
        this.fadeAlpha = Math.max(0, 1 - this.phaseTimer / FADE_DURATION);
        if (this.fadeAlpha <= 0) {
          this.phase = Phase.regrow;
        }
        break;
      }
      case Phase.regrow: {
        this.seedTree();
        this.phase = Phase.growing;
        this.accumulator = 0;
        break;
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void {
    for (let row = 0; row < rows; row++) {
      if (row >= this.grid.length) break;
      for (let col = 0; col < cols; col++) {
        if (col >= this.grid[row].length) break;
        const cell = this.grid[row][col];
        if (!cell) continue;

        if (this.phase === Phase.fade) {
          ctx.globalAlpha = this.fadeAlpha;
        }

        ctx.fillStyle = cell.color;
        ctx.fillText(cell.char, col * charW, (row + 1) * charH);
      }
    }

    if (this.phase === Phase.fade) {
      ctx.globalAlpha = 1;
    }
  }

  // --- internals ---

  private seedTree(): void {
    this.grid = Array.from({ length: this.rows }, () =>
      Array.from<Cell | null>({ length: this.cols }).fill(null),
    );
    this.queue = [];
    this.nextShootSide = BranchType.shootLeft;

    this.queue.push({
      age: 0,
      dx: 0,
      dy: -1,
      life: this.config.life,
      shootCooldown: this.config.multiplier * COOLDOWN_MULTIPLIER,
      type: BranchType.trunk,
      x: Math.floor(this.cols / 2),
      y: this.rows - 1,
    });
  }

  private processStep(): void {
    if (this.queue.length === 0) return;

    const branch = this.queue.shift()!;
    const { multiplier, leafColor, trunkColor } = this.config;

    const deltas = getDeltas(branch, multiplier);
    branch.dx = deltas.dx;
    branch.dy = deltas.dy;
    branch.x += branch.dx;
    branch.y += branch.dy;
    branch.age++;
    branch.shootCooldown--;

    if (branch.x < 0 || branch.x >= this.cols || branch.y < 0 || branch.y >= this.rows) {
      branch.life--;
      if (branch.life > 0) this.queue.push(branch);
      return;
    }

    const { char, color } = getChar(branch.type, branch.dx, branch.dy, branch.life, leafColor, trunkColor);
    this.grid[branch.y][branch.x] = { char, color };

    this.handleBranching(branch);

    branch.life--;
    if (branch.life > 0) {
      this.queue.push(branch);
    }
  }

  private handleBranching(branch: Branch): void {
    const { multiplier, life: totalLife } = this.config;

    if (branch.type === BranchType.trunk) {
      const shouldSpawnShoot =
        branch.shootCooldown <= 0 &&
        (Math.random() < SHOOT_SPAWN_CHANCE || branch.life % multiplier === 0);

      if (shouldSpawnShoot) {
        this.spawnShoot(branch);
        branch.shootCooldown = multiplier * COOLDOWN_MULTIPLIER;
      }

      if (branch.life > TRUNK_FORK_MIN_LIFE && Math.random() < TRUNK_FORK_CHANCE) {
        this.queue.push({
          age: branch.age,
          dx: branch.dx,
          dy: branch.dy,
          life: branch.life,
          shootCooldown: branch.shootCooldown,
          type: BranchType.trunk,
          x: branch.x,
          y: branch.y,
        });
      }
    }

    if (
      (branch.type === BranchType.trunk ||
        branch.type === BranchType.shootLeft ||
        branch.type === BranchType.shootRight) &&
      branch.life < multiplier + 2
    ) {
      this.queue.push({
        age: 0,
        dx: branch.dx,
        dy: branch.dy,
        life: branch.life,
        shootCooldown: 0,
        type: BranchType.dying,
        x: branch.x,
        y: branch.y,
      });
    }

    if (branch.type === BranchType.dying && branch.life < 3) {
      this.queue.push({
        age: 0,
        dx: branch.dx,
        dy: branch.dy,
        life: branch.life,
        shootCooldown: 0,
        type: BranchType.dead,
        x: branch.x,
        y: branch.y,
      });
    }
  }

  private spawnShoot(parent: Branch): void {
    const type = this.nextShootSide;
    this.nextShootSide =
      type === BranchType.shootLeft ? BranchType.shootRight : BranchType.shootLeft;

    this.queue.push({
      age: 0,
      dx: parent.dx,
      dy: parent.dy,
      life: parent.life + Math.floor(Math.random() * 5) - 2,
      shootCooldown: this.config.multiplier * COOLDOWN_MULTIPLIER,
      type,
      x: parent.x,
      y: parent.y,
    });
  }
}
