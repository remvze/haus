import type { WeatherData, WeatherSystem } from '../types';

// --- Layout constants ---
const GROUND_ROWS = 7;
const HOUSE_WIDTH = 64;
const HOUSE_HEIGHT = 13;
const CHIMNEY_X_OFFSET = 10;
const TREE_X_OFFSET = 20;
const MAILBOX_X_OFFSET = 10;
const FENCE_GAP = 2;
const PINE_X_OFFSET = 18;
const PINE_MIN_COLS = 120;
const PINE_FIT_MARGIN = 10;

// --- Pseudo-random seed constants ---
const SEED_A = 0x5deece6;
const SEED_B = 0xb;
const SEED_MOD = 100;

// --- Ground generation thresholds ---
const FLOWER_THRESHOLD = 5;
const GRASS_BLADE_THRESHOLD = 15;
const ROCK_THRESHOLD = 20;
const DOT_THRESHOLD = 25;

// --- Colors ---
const COLORS = {
  day: {
    grass: 'rgb(50,120,50)',
    grassBlade: 'rgb(30,90,30)',
    flowers: ['rgb(160,90,140)', 'rgb(160,90,90)', 'rgb(90,140,150)', 'rgb(150,150,80)'],
    soil: 'rgb(101,67,33)',
    roof: 'rgb(120,30,30)',
    wood: 'rgb(180,160,130)',
    window: 'rgb(80,150,160)',
    door: 'rgb(120,65,25)',
    chimney: 'rgb(100,100,100)',
    chimneySmoke: 'rgb(150,150,150)',
    fence: 'rgb(180,180,180)',
    fenceEqual: 'rgb(120,120,120)',
    groundCarets: 'rgb(40,110,40)',
    tree: 'rgb(30,90,30)',
    mailbox: 'rgb(60,60,130)',
    pine: 'rgb(30,90,30)',
  },
  night: {
    grass: 'rgb(0,50,0)',
    grassBlade: 'rgb(0,30,0)',
    flowers: ['rgb(80,0,80)', 'rgb(80,0,0)', 'rgb(0,0,80)', 'rgb(80,80,0)'],
    soil: 'rgb(60,40,20)',
    roof: 'rgb(100,0,100)',
    wood: 'rgb(100,70,50)',
    window: 'rgb(200,170,60)',
    door: 'rgb(80,40,10)',
    chimney: 'rgb(60,60,60)',
    chimneySmoke: 'rgb(100,100,100)',
    fence: 'rgb(120,120,120)',
    fenceEqual: 'rgb(80,80,80)',
    groundCarets: 'rgb(0,50,0)',
    tree: 'rgb(0,50,0)',
    mailbox: 'rgb(0,0,80)',
    pine: 'rgb(0,50,0)',
  },
};

interface ColorSet {
  readonly grass: string;
  readonly grassBlade: string;
  readonly flowers: readonly string[];
  readonly soil: string;
  readonly roof: string;
  readonly wood: string;
  readonly window: string;
  readonly door: string;
  readonly chimney: string;
  readonly chimneySmoke: string;
  readonly fence: string;
  readonly fenceEqual: string;
  readonly groundCarets: string;
  readonly tree: string;
  readonly mailbox: string;
  readonly pine: string;
}

// --- ASCII sprites (from weathr) ---
const HOUSE_ASCII = [
  '          (                  ',
  '                             ',
  '            )                ',
  '          ( _   _._          ',
  "           |_|-'_~_`-._      ",
  "        _.-'-_~_-~_-~-_`-._  ",
  "    _.-'_~-_~-_-~-_~_~-_~-_`-._",
  '   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '     |  []  []   []   []  [] |',
  '     |           __    ___   |',
  '   ._|  []  []  | .|  [___]  |_._._._._._._._._._._._._._._._._.',
  '   |=|________()|__|()_______|=|=|=|=|=|=|=|=|=|=|=|=|=|=|=|=|=|',
  ' ^^^^^^^^^^^^^^^ === ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
];

const TREE_ASCII = [
  '      ####      ',
  '    ########    ',
  '   ##########   ',
  '    ########    ',
  '      _||_      ',
];

const FENCE_ASCII = ['|--|--|--|--|', '|  |  |  |  |'];

const MAILBOX_ASCII = [' ___ ', '|___|', '  |  '];

const PINE_ASCII = [
  '    *    ',
  '   ***   ',
  '  *****  ',
  ' ******* ',
  '   |||   ',
];

// --- Helpers ---

const pseudoRand = (x: number, y: number): number =>
  (((x ^ SEED_A) * (y ^ SEED_B)) >>> 0) % SEED_MOD;

const getHouseX = (cols: number): number =>
  Math.floor(cols / 2) - Math.floor(HOUSE_WIDTH / 2);

const getHorizonY = (rows: number): number => rows - GROUND_ROWS;

const getHouseY = (rows: number): number => getHorizonY(rows) - HOUSE_HEIGHT;

export const getChimneyPosition = (cols: number, rows: number): { x: number; y: number } => ({
  x: getHouseX(cols) + CHIMNEY_X_OFFSET,
  y: getHouseY(rows),
});

// --- Ground pre-generation ---

interface GroundCell {
  char: string;
  color: string;
}

const generateGround = (cols: number, palette: ColorSet): GroundCell[][] => {
  const grid: GroundCell[][] = [];

  for (let row = 0; row < GROUND_ROWS; row++) {
    const line: GroundCell[] = [];
    for (let col = 0; col < cols; col++) {
      const r = pseudoRand(col, row);

      if (row === 0) {
        if (r < FLOWER_THRESHOLD) {
          const fIdx = (col + row) % palette.flowers.length;
          line.push({ char: '*', color: palette.flowers[fIdx] });
        } else if (r < GRASS_BLADE_THRESHOLD) {
          line.push({ char: ',', color: palette.grassBlade });
        } else {
          line.push({ char: '^', color: palette.grass });
        }
      } else {
        if (r < ROCK_THRESHOLD) {
          line.push({ char: '~', color: palette.soil });
        } else if (r < DOT_THRESHOLD) {
          line.push({ char: '.', color: palette.soil });
        } else {
          line.push({ char: ' ', color: palette.soil });
        }
      }
    }
    grid.push(line);
  }

  return grid;
};

// --- Sprite rendering ---

const renderSprite = (
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  sx: number,
  sy: number,
  charW: number,
  charH: number,
  colorFn: (row: number, ch: string) => string | null,
  cols: number,
): void => {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === ' ') continue;
      const gx = sx + j;
      if (gx < 0 || gx >= cols) continue;
      const color = colorFn(i, ch);
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillText(ch, gx * charW, (sy + i) * charH);
    }
  }
};

// --- House color resolver ---

const houseColorFn = (palette: ColorSet) => (row: number, ch: string): string | null => {
  if (row <= 3) {
    if (ch === '(' || ch === ')' || ch === '_') return 'rgb(100,100,100)';
    return 'rgb(150,150,150)';
  }
  if (row <= 6) return palette.roof;
  if (row === 7) return palette.roof;

  if (row <= 10) {
    if (ch === '[' || ch === ']') return palette.window;
    if (ch === '(' || ch === ')') return palette.door;
    if (ch === '=') return palette.fenceEqual;
    return palette.wood;
  }

  if (row === 11) {
    if (ch === '=' || ch === '|') return palette.fenceEqual;
    if (ch === '(' || ch === ')') return palette.door;
    return palette.wood;
  }

  if (row === 12) {
    if (ch === '^') return palette.groundCarets;
    if (ch === '=') return palette.fenceEqual;
    return palette.wood;
  }

  return palette.wood;
};

// --- System ---

export class SceneSystem implements WeatherSystem {
  private cols = 0;
  private rows = 0;
  private isDay = true;
  private ground: GroundCell[][] = [];

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.ground = generateGround(cols, this.palette());
  }

  configure(weather: WeatherData): void {
    if (weather.isDay !== this.isDay) {
      this.isDay = weather.isDay;
      this.ground = generateGround(this.cols, this.palette());
    }
  }

  update(_dt: number): void {}

  render(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void {
    const palette = this.palette();
    const horizonY = getHorizonY(rows);

    this.renderGround(ctx, cols, horizonY, charW, charH);
    this.renderHouse(ctx, cols, rows, charW, charH, palette);
    this.renderDecorations(ctx, cols, rows, charW, charH, palette);
  }

  private palette(): ColorSet {
    return this.isDay ? COLORS.day : COLORS.night;
  }

  private renderGround(
    ctx: CanvasRenderingContext2D,
    cols: number,
    horizonY: number,
    charW: number,
    charH: number,
  ): void {
    for (let row = 0; row < this.ground.length; row++) {
      const line = this.ground[row];
      const gy = horizonY + row;
      for (let col = 0; col < Math.min(line.length, cols); col++) {
        const cell = line[col];
        if (cell.char === ' ') continue;
        ctx.fillStyle = cell.color;
        ctx.fillText(cell.char, col * charW, gy * charH);
      }
    }
  }

  private renderHouse(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
    palette: ColorSet,
  ): void {
    const hx = getHouseX(cols);
    const hy = getHouseY(rows);
    renderSprite(ctx, HOUSE_ASCII, hx, hy, charW, charH, houseColorFn(palette), cols);
  }

  private renderDecorations(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
    palette: ColorSet,
  ): void {
    const horizonY = getHorizonY(rows);
    const houseX = getHouseX(cols);

    this.renderTree(ctx, cols, horizonY, houseX, charW, charH, palette);
    this.renderFence(ctx, cols, horizonY, houseX, charW, charH, palette);
    this.renderMailbox(ctx, cols, horizonY, houseX, charW, charH, palette);

    if (cols > PINE_MIN_COLS) {
      this.renderPine(ctx, cols, horizonY, houseX, charW, charH, palette);
    }
  }

  private renderTree(
    ctx: CanvasRenderingContext2D,
    cols: number,
    horizonY: number,
    houseX: number,
    charW: number,
    charH: number,
    palette: ColorSet,
  ): void {
    const treeX = Math.max(0, houseX - TREE_X_OFFSET);
    const treeY = horizonY - TREE_ASCII.length;
    if (treeX <= 0) return;
    renderSprite(ctx, TREE_ASCII, treeX, treeY, charW, charH, () => palette.tree, cols);
  }

  private renderFence(
    ctx: CanvasRenderingContext2D,
    cols: number,
    horizonY: number,
    houseX: number,
    charW: number,
    charH: number,
    palette: ColorSet,
  ): void {
    const fenceX = houseX + HOUSE_WIDTH + FENCE_GAP;
    const fenceY = horizonY - FENCE_ASCII.length;
    if (fenceX >= cols) return;
    renderSprite(ctx, FENCE_ASCII, fenceX, fenceY, charW, charH, () => palette.fence, cols);
  }

  private renderMailbox(
    ctx: CanvasRenderingContext2D,
    cols: number,
    horizonY: number,
    houseX: number,
    charW: number,
    charH: number,
    palette: ColorSet,
  ): void {
    const treeX = Math.max(0, houseX - TREE_X_OFFSET);
    const mailboxX = Math.max(0, treeX - MAILBOX_X_OFFSET);
    const mailboxY = horizonY - MAILBOX_ASCII.length;
    renderSprite(ctx, MAILBOX_ASCII, mailboxX, mailboxY, charW, charH, () => palette.mailbox, cols);
  }

  private renderPine(
    ctx: CanvasRenderingContext2D,
    cols: number,
    horizonY: number,
    houseX: number,
    charW: number,
    charH: number,
    palette: ColorSet,
  ): void {
    const pineX = houseX + HOUSE_WIDTH + PINE_X_OFFSET;
    const pineY = horizonY - PINE_ASCII.length;
    if (pineX + PINE_FIT_MARGIN >= cols) return;
    renderSprite(ctx, PINE_ASCII, pineX, pineY, charW, charH, () => palette.pine, cols);
  }
}
