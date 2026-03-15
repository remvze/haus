import type { WeatherCondition, WeatherData } from './types';

const POLL_INTERVAL_MS = 15 * 60 * 1000;

const WMO_MAP: Record<number, WeatherCondition> = {
  0: 'clear',
  1: 'partly-cloudy',
  2: 'partly-cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'rain',
  57: 'rain',
  61: 'rain',
  63: 'rain',
  65: 'heavy-rain',
  66: 'rain',
  67: 'rain',
  71: 'snow',
  73: 'snow',
  75: 'heavy-snow',
  77: 'snow',
  80: 'heavy-rain',
  81: 'heavy-rain',
  82: 'heavy-rain',
  85: 'snow',
  86: 'heavy-snow',
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};

const mapWmoCode = (code: number): WeatherCondition =>
  WMO_MAP[code] ?? 'clear';

export class WeatherService {
  private lat: number;
  private lng: number;
  private lastFetch = 0;
  private cached: WeatherData | null = null;
  private fetching = false;

  constructor(lat: number, lng: number) {
    this.lat = lat;
    this.lng = lng;
  }

  async getWeather(): Promise<WeatherData | null> {
    const now = Date.now();
    if (this.cached && now - this.lastFetch < POLL_INTERVAL_MS) {
      return this.cached;
    }

    if (this.fetching) return this.cached;

    this.fetching = true;
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${this.lat}&longitude=${this.lng}` +
        `&current_weather=true`;

      const res = await fetch(url);
      if (!res.ok) return this.cached;

      const data = await res.json();
      const cw = data.current_weather;

      this.cached = {
        condition: mapWmoCode(cw.weathercode),
        temperature: cw.temperature,
        windSpeed: cw.windspeed,
        windDirection: cw.winddirection,
        isDay: cw.is_day === 1,
        precipitation: 0,
      };
      this.lastFetch = now;

      return this.cached;
    } catch {
      return this.cached;
    } finally {
      this.fetching = false;
    }
  }
}
