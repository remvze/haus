import type { RainIntensity, WeatherData, WeatherSystem } from '../types';

interface Drop {
  x: number;
  y: number;
  speed: number;
  depth: 0 | 1;
}

interface Splash {
  x: number;
  y: number;
  frame: number;
  timer: number;
}

const SPLASH_CHARS = ['.', 'o', 'O'];
const SPLASH_FRAME_DURATION = 0.1;
const MAX_SPLASHES = 100;

const intensityConfig = (intensity: RainIntensity, cols: number) => {
  switch (intensity) {
    case 'drizzle':
      return { count: Math.floor(cols * 0.25), speedMin: 8, speedMax: 14, splashChance: 0.1 };
    case 'light':
      return { count: Math.floor(cols * 0.5), speedMin: 14, speedMax: 28, splashChance: 0.25 };
    case 'heavy':
      return { count: Math.floor(cols * 1.0), speedMin: 24, speedMax: 40, splashChance: 0.45 };
    case 'storm':
      return { count: Math.floor(cols * 1.5), speedMin: 32, speedMax: 50, splashChance: 0.6 };
  }
};

const dropChars = (intensity: RainIntensity, windX: number): { fg: string; bg: string } => {
  if (intensity === 'storm') {
    const ch = windX < -0.5 ? '/' : windX > 0.5 ? '\\' : '|';
    return { fg: ch, bg: ch };
  }
  if (intensity === 'drizzle') return { fg: ',', bg: '.' };
  return { fg: '|', bg: ':' };
};

export class RainSystem implements WeatherSystem {
  private drops: Drop[] = [];
  private splashes: Splash[] = [];
  private cols = 0;
  private rows = 0;
  private intensity: RainIntensity = 'light';
  private windX = 0;

  init(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.drops = [];
    this.splashes = [];
  }

  configure(weather: WeatherData): void {
    const c = weather.condition;
    if (c === 'drizzle') this.intensity = 'drizzle';
    else if (c === 'rain') this.intensity = 'light';
    else if (c === 'heavy-rain') this.intensity = 'heavy';
    else if (c === 'thunderstorm') this.intensity = 'storm';
    else this.intensity = 'light';

    const rad = (weather.windDirection * Math.PI) / 180;
    this.windX = (weather.windSpeed / 40) * -Math.sin(rad);

    this.adjustDropCount();
  }

  private adjustDropCount(): void {
    const cfg = intensityConfig(this.intensity, this.cols);
    const target = cfg.count;

    while (this.drops.length < target) {
      this.drops.push(this.createDrop(true));
    }
    while (this.drops.length > target) {
      this.drops.pop();
    }
  }

  private createDrop(randomY: boolean): Drop {
    const cfg = intensityConfig(this.intensity, this.cols);
    const depth = Math.random() > 0.5 ? 1 : 0 as 0 | 1;
    const speedFactor = depth === 1 ? 1 : 0.6;

    return {
      x: Math.random() * this.cols * 2 - this.cols * 0.5,
      y: randomY ? Math.random() * this.rows : -(Math.random() * 5),
      speed: (cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin)) * speedFactor,
      depth,
    };
  }

  update(dt: number): void {
    const s = dt / 1000;
    const cfg = intensityConfig(this.intensity, this.cols);

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.y += drop.speed * s;
      drop.x += this.windX * drop.speed * 0.3 * s;

      if (drop.y >= this.rows) {
        if (
          drop.depth === 1 &&
          this.splashes.length < MAX_SPLASHES &&
          Math.random() < cfg.splashChance
        ) {
          this.splashes.push({
            x: Math.floor(drop.x),
            y: this.rows - 1,
            frame: 0,
            timer: 0,
          });
        }
        this.drops[i] = this.createDrop(false);
      }
    }

    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const splash = this.splashes[i];
      splash.timer += s;
      if (splash.timer >= SPLASH_FRAME_DURATION) {
        splash.timer -= SPLASH_FRAME_DURATION;
        splash.frame++;
        if (splash.frame >= SPLASH_CHARS.length) {
          this.splashes.splice(i, 1);
        }
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
    const chars = dropChars(this.intensity, this.windX);

    for (const drop of this.drops) {
      const gx = Math.floor(drop.x);
      const gy = Math.floor(drop.y);
      if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) continue;

      if (drop.depth === 0) {
        ctx.fillStyle = 'rgb(80,80,90)';
        ctx.fillText(chars.bg, gx * charW, gy * charH);
      } else {
        const isCyan = this.intensity === 'drizzle' || this.intensity === 'heavy';
        ctx.fillStyle = isCyan ? 'rgb(100,200,220)' : 'rgb(200,200,210)';
        ctx.fillText(chars.fg, gx * charW, gy * charH);
      }
    }

    ctx.fillStyle = 'rgb(150,180,200)';
    for (const splash of this.splashes) {
      if (splash.x < 0 || splash.x >= this.cols) continue;
      ctx.fillText(SPLASH_CHARS[splash.frame], splash.x * charW, splash.y * charH);
    }
  }
}
