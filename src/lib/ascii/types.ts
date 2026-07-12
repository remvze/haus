export interface AsciiPattern {
  dispose?(): void;
  init(cols: number, rows: number): void;
  render(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    charW: number,
    charH: number,
  ): void;
  update(dt: number): void;
}
