// Inspired by weathr (https://github.com/veirt/weathr) by Veirt
import type { AsciiPattern } from '../../types';
import type { Location } from '@/stores/settings';
import type { WeatherData, WeatherSystem } from './types';
import { WeatherService } from './weather-service';
import { StarsSystem } from './systems/stars';
import { MoonSystem } from './systems/moon';
import { SunSystem } from './systems/sun';
import { CloudSystem } from './systems/clouds';
import { RainSystem } from './systems/rain';
import { SnowSystem } from './systems/snow';
import { FogSystem } from './systems/fog';
import { LightningSystem } from './systems/lightning';
import { FireflySystem } from './systems/fireflies';
import { BirdSystem } from './systems/birds';
import { LeavesSystem } from './systems/leaves';
import { AirplaneSystem } from './systems/airplane';
import { SceneSystem } from './systems/scene';
import { SmokeSystem } from './systems/smoke';

const POLL_INTERVAL = 15 * 60;
const DEFAULT_WEATHER: WeatherData = {
  condition: 'clear',
  temperature: 20,
  windSpeed: 5,
  windDirection: 0,
  isDay: false,
  precipitation: 0,
};

interface SystemEntry {
  system: WeatherSystem;
  active: boolean;
}

export class WeatherPattern implements AsciiPattern {
  private service: WeatherService | null;
  private weather: WeatherData = DEFAULT_WEATHER;
  private pollTimer = 0;
  private initialFetchDone = false;

  private scene: SystemEntry;
  private stars: SystemEntry;
  private moon: SystemEntry;
  private sun: SystemEntry;
  private smoke: SystemEntry;
  private clouds: SystemEntry;
  private rain: SystemEntry;
  private snow: SystemEntry;
  private fog: SystemEntry;
  private lightning: SystemEntry;
  private fireflies: SystemEntry;
  private birds: SystemEntry;
  private leaves: SystemEntry;
  private airplane: SystemEntry;

  private allSystems: SystemEntry[];

  constructor(location: Location | null) {
    this.service = location ? new WeatherService(location.lat, location.lng) : null;

    this.scene = { system: new SceneSystem(), active: true };
    this.stars = { system: new StarsSystem(), active: true };
    this.moon = { system: new MoonSystem(), active: true };
    this.sun = { system: new SunSystem(), active: false };
    this.smoke = { system: new SmokeSystem(), active: true };
    this.clouds = { system: new CloudSystem(), active: true };
    this.rain = { system: new RainSystem(), active: false };
    this.snow = { system: new SnowSystem(), active: false };
    this.fog = { system: new FogSystem(), active: false };
    this.lightning = { system: new LightningSystem(), active: false };
    this.fireflies = { system: new FireflySystem(), active: false };
    this.birds = { system: new BirdSystem(), active: false };
    this.leaves = { system: new LeavesSystem(), active: true };
    this.airplane = { system: new AirplaneSystem(), active: true };

    // Render order: back to front
    this.allSystems = [
      this.scene,
      this.stars,
      this.moon,
      this.sun,
      this.smoke,
      this.clouds,
      this.birds,
      this.airplane,
      this.rain,
      this.snow,
      this.leaves,
      this.fog,
      this.fireflies,
      this.lightning,
    ];
  }

  init(cols: number, rows: number): void {
    for (const entry of this.allSystems) {
      entry.system.init(cols, rows);
    }
    this.pollTimer = POLL_INTERVAL;
    this.initialFetchDone = false;
  }

  update(dt: number): void {
    const s = dt / 1000;
    this.pollTimer += s;

    if (!this.initialFetchDone || this.pollTimer >= POLL_INTERVAL) {
      this.pollTimer = 0;
      this.initialFetchDone = true;
      this.fetchWeather();
    }

    for (const entry of this.allSystems) {
      if (entry.active) entry.system.update(dt);
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void {
    for (const entry of this.allSystems) {
      if (entry.active) entry.system.render(ctx, cols, rows, charW, charH);
    }

    const ls = this.lightning.system as LightningSystem;
    if (this.lightning.active && ls.isFlashing()) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0, 0, cols * charW, rows * charH);
    }
  }

  dispose(): void {}

  private fetchWeather(): void {
    if (!this.service) {
      this.applyWeather(DEFAULT_WEATHER);
      return;
    }

    this.service.getWeather().then(data => {
      if (data) {
        this.weather = data;
        this.applyWeather(data);
      }
    });
  }

  private applyWeather(w: WeatherData): void {
    const { condition: c, isDay, temperature } = w;
    const isNight = !isDay;
    const isWarm = temperature > 15;
    const isClear = c === 'clear' || c === 'partly-cloudy';
    const hasRain = c === 'drizzle' || c === 'rain' || c === 'heavy-rain' || c === 'thunderstorm';
    const hasSnow = c === 'snow' || c === 'heavy-snow';

    this.scene.active = true;
    this.stars.active = isNight;
    this.moon.active = isNight;
    this.sun.active = isDay && isClear;
    this.smoke.active = !hasRain;
    this.birds.active = isDay && isClear;
    this.fireflies.active = isNight && isWarm && isClear;
    this.rain.active = hasRain;
    this.snow.active = hasSnow;
    this.fog.active = c === 'fog';
    this.lightning.active = c === 'thunderstorm';
    this.clouds.active = true;
    this.leaves.active = true;
    this.airplane.active = true;

    for (const entry of this.allSystems) {
      entry.system.configure?.(w);
    }
  }
}
