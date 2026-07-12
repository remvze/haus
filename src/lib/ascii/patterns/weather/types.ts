export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'snow'
  | 'heavy-snow'
  | 'thunderstorm';

export type RainIntensity = 'drizzle' | 'light' | 'heavy' | 'storm';
export type SnowIntensity = 'light' | 'medium' | 'heavy';
export type CloudDensity = 'sparse' | 'medium' | 'dense';

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number;
  windSpeed: number;
  windDirection: number;
  isDay: boolean;
  precipitation: number;
}

export interface WeatherSystem {
  init(cols: number, rows: number): void;
  update(dt: number): void;
  render(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void;
  configure?(weather: WeatherData): void;
  dispose?(): void;
}
