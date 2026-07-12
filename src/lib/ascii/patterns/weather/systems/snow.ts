import type { SnowIntensity, WeatherData, WeatherSystem } from '../types';

interface Flake {
  x: number;
  y: number;
  speed: number;
  swayOffset: number;
  depth: 0 | 1;
  char: string;
}

const CHARS = ['.', '\u00B7', '*'] as const;
const SPAWN_WIDTH_FACTOR = 3;

const intensityCount = (intensity: SnowIntensity, cols: number): number => {
  switch (intensity) {
    case 'light': return Math.floor(cols * 0.3);
    case 'medium': return Math.floor(cols * 0.6);
    case 'heavy': return Math.floor(cols * 1.0);
  }
};

export class SnowSystem implements WeatherSystem {
  private flakes: Flake[] = [];
  private cols = 0;
  private rows = 0;
  private intensity: SnowIntensity = 'medium';
  private windX = 0;

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.flakes = [];
  }

  configure(weather: WeatherData): void {
    const c = weather.condition;
    this.intensity = c === 'heavy-snow' ? 'heavy' : c === 'snow' ? 'medium' : 'light';

    const rad = (weather.windDirection * Math.PI) / 180;
    this.windX = (weather.windSpeed / 20) * -Math.sin(rad);

    this.adjustFlakeCount();
  }

  private adjustFlakeCount(): void {
    const target = intensityCount(this.intensity, this.cols);

    while (this.flakes.length < target) {
      this.flakes.push(this.createFlake(true));
    }
    while (this.flakes.length > target) {
      this.flakes.pop();
    }
  }

  private createFlake(randomY: boolean): Flake {
    const depth = Math.random() > 0.5 ? 1 : 0 as 0 | 1;
    const speed = depth === 1
      ? 1.5 + Math.random() * 2.5
      : 0.5 + Math.random() * 1.5;

    const charIdx = speed < 1.5 ? 0 : speed > 3 ? 2 : 1;
    const spawnW = this.cols * SPAWN_WIDTH_FACTOR;

    return {
      x: Math.random() * spawnW - (spawnW - this.cols) / 2,
      y: randomY ? Math.random() * this.rows : -(Math.random() * 5),
      speed,
      swayOffset: Math.random() * 100,
      depth,
      char: CHARS[charIdx],
    };
  }

  update(dt: number): void {
    const s = dt / 1000;

    for (let i = this.flakes.length - 1; i >= 0; i--) {
      const f = this.flakes[i];
      f.y += f.speed * s;
      f.x += Math.sin(f.y * 0.2 + f.swayOffset) * 0.5 * s;
      f.x += this.windX * s;

      if (f.y > this.rows) {
        this.flakes[i] = this.createFlake(false);
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    _cols: number,
    _rows: number,
    charW: number,
    charH: number,
  ): void {
    for (const f of this.flakes) {
      const gx = Math.floor(f.x);
      const gy = Math.floor(f.y);
      if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) continue;

      ctx.fillStyle = f.depth === 1 ? 'rgb(220,220,230)' : 'rgb(100,100,110)';
      ctx.fillText(f.char, gx * charW, gy * charH);
    }
  }
}
