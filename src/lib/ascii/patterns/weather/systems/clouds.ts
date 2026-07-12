import type { CloudDensity, WeatherData, WeatherSystem } from '../types';

const CLOUD_SHAPES: string[][] = [
  [
    '     .--.     ',
    '  .-(    ).   ',
    ' (___.__)__)  ',
  ],
  [
    '        _ _       ',
    '      ( `  )_     ',
    '     (    )   `)  ',
    '      \\_  (___ )  ',
  ],
  [
    '     .--.     ',
    '  .-(    ).   ',
    ' (___.__)_)   ',
  ],
  [
    '      _ _      ',
    '    ( `  )_    ',
    '   (    )   `) ',
    '     `--\'      ',
  ],
];

interface Cloud {
  x: number;
  y: number;
  shape: string[];
  speed: number;
  width: number;
}

const SPEED_MIN = 0.5;
const SPEED_MAX = 1.5;

const maxClouds = (cols: number, density: CloudDensity): number => {
  switch (density) {
    case 'sparse': return Math.max(1, Math.floor(cols / 40));
    case 'medium': return Math.max(2, Math.floor(cols / 25));
    case 'dense': return Math.max(3, Math.floor(cols / 15));
  }
};

const spawnChance = (density: CloudDensity): number => {
  switch (density) {
    case 'sparse': return 0.001;
    case 'medium': return 0.003;
    case 'dense': return 0.006;
  }
};

export class CloudSystem implements WeatherSystem {
  private clouds: Cloud[] = [];
  private cols = 0;
  private rows = 0;
  private density: CloudDensity = 'medium';
  private dark = false;

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.clouds = [];
  }

  configure(weather: WeatherData): void {
    const c = weather.condition;

    if (c === 'clear') this.density = 'sparse';
    else if (c === 'partly-cloudy') this.density = 'medium';
    else this.density = 'dense';

    this.dark = c === 'overcast' || c === 'heavy-rain' || c === 'thunderstorm' || c === 'fog';
  }

  update(dt: number): void {
    const s = dt / 1000;
    const max = maxClouds(this.cols, this.density);

    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];
      cloud.x += cloud.speed * s;

      if (cloud.x > this.cols + 5) {
        this.clouds.splice(i, 1);
      }
    }

    if (this.clouds.length < max && Math.random() < spawnChance(this.density)) {
      const shape = CLOUD_SHAPES[Math.floor(Math.random() * CLOUD_SHAPES.length)];
      const width = Math.max(...shape.map(l => l.length));
      this.clouds.push({
        x: -width,
        y: Math.floor(Math.random() * (this.rows * 0.3)),
        shape,
        speed: SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN),
        width,
      });
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    _cols: number,
    _rows: number,
    charW: number,
    charH: number,
  ): void {
    const color = this.dark ? 'rgb(90,90,100)' : 'rgb(180,180,190)';

    for (const cloud of this.clouds) {
      ctx.fillStyle = color;
      for (let row = 0; row < cloud.shape.length; row++) {
        const line = cloud.shape[row];
        for (let col = 0; col < line.length; col++) {
          const ch = line[col];
          if (ch === ' ') continue;

          const gx = Math.floor(cloud.x) + col;
          const gy = cloud.y + row;
          if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) continue;

          ctx.fillText(ch, gx * charW, gy * charH);
        }
      }
    }
  }
}
