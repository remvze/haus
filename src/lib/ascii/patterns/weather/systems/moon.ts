import type { WeatherSystem } from '../types';

const SYNODIC_MONTH = 29.53058770576;
const KNOWN_NEW_MOON = new Date('2024-01-11T11:57:00Z').getTime();

const getMoonPhaseIndex = (): number => {
  const elapsed = (Date.now() - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
  const phase = ((elapsed % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  return Math.floor((phase / SYNODIC_MONTH) * 8) % 8;
};

// ~  = opaque body (renders as space but occludes stars)
// Other chars = visible texture
const MOON_PHASES: string[][] = [
  // 0: New Moon (invisible)
  [],
  // 1: Waxing Crescent
  [
    '    _.--._  ',
    '  ./      \\.',
    ' /    ~    |',
    '|     ~    |',
    '|     ~    |',
    ' \\    ~    |',
    '  `.\\    ./\'',
    '    `--\'   ',
  ],
  // 2: First Quarter
  [
    '    _.--._  ',
    '  ./~~~~~~\\.',
    ' /~~~~~~~~~|',
    '|~~~~~~~~~~|',
    '|~~~~~~~~~~|',
    ' \\~~~~~~~~~|',
    '  `.~~~~~~./\'',
    '    `--\'   ',
  ],
  // 3: Waxing Gibbous
  [
    '    _.--._  ',
    '  ./~~o~~~\\.',
    ' /~~~~~~~~~\\',
    '|~~~o~~~~~~~|',
    '|~~~~~~~~~~~|',
    ' \\~~~~~~~~~/',
    '  `.~~o~~./\'',
    '    `--\'   ',
  ],
  // 4: Full Moon
  [
    '    _.--._  ',
    '  ./~~o~~~\\.',
    ' /~~.~~~~~~\\',
    '|~~~o~~~~~~~|',
    '|~~~~~.~~~~~|',
    ' \\~~~~~~~~~/',
    '  `.~~o~~./\'',
    '    `--\'   ',
  ],
  // 5: Waning Gibbous
  [
    '  _.--._    ',
    './~~~o~~\\.  ',
    '/~~~~~~~~~\\ ',
    '|~~~~~~~o~~~|',
    '|~~~~~~~~~~~|',
    ' \\~~~~~~~~~/',
    '  \'./~~o~~.`',
    '    \'--`   ',
  ],
  // 6: Last Quarter
  [
    '  _.--._    ',
    './~~~~~~\\.  ',
    '|~~~~~~~~~\\ ',
    '|~~~~~~~~~~|',
    '|~~~~~~~~~~|',
    '|~~~~~~~~~/ ',
    '  \'./~~~~~~.`',
    '    \'--`   ',
  ],
  // 7: Waning Crescent
  [
    '  _.--._    ',
    './      \\.  ',
    '|    ~    \\ ',
    '|    ~     |',
    '|    ~     |',
    '|    ~    / ',
    '  \'./    .`',
    '    \'--`   ',
  ],
];

export class MoonSystem implements WeatherSystem {
  private cols = 0;
  private rows = 0;
  private posX = 0;
  private posY = 0;

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.posX = Math.floor(cols * 0.7);
    this.posY = Math.floor(rows * 0.08);
  }

  update(_dt: number): void {}

  render(
    ctx: CanvasRenderingContext2D,
    _cols: number,
    _rows: number,
    charW: number,
    charH: number,
  ): void {
    const phaseIdx = getMoonPhaseIndex();
    const lines = MOON_PHASES[phaseIdx];
    if (!lines || lines.length === 0) return;

    for (let row = 0; row < lines.length; row++) {
      const line = lines[row];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch === ' ') continue;

        const gx = this.posX + col;
        const gy = this.posY + row;
        if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) continue;

        if (ch === '~') {
          ctx.fillStyle = 'rgb(30,30,40)';
          ctx.fillText(' ', gx * charW, gy * charH);
        } else {
          ctx.fillStyle = 'rgb(220,220,200)';
          ctx.fillText(ch, gx * charW, gy * charH);
        }
      }
    }
  }
}
