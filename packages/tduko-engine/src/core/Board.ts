// packages/tduko-engine/src/core/Board.ts

const ALL = 0x1ff;

export const bit = (d: number): number => 1 << (d - 1);
export const box = (r: number, c: number): number => Math.floor(r / 3) * 3 + Math.floor(c / 3);
export const idx = (r: number, c: number): number => r * 9 + c;

export class Board {
  public r: Uint16Array;
  public c: Uint16Array;
  public b: Uint16Array;
  public g: number[];

  constructor(str: string) {
    this.r = new Uint16Array(9).fill(ALL);
    this.c = new Uint16Array(9).fill(ALL);
    this.b = new Uint16Array(9).fill(ALL);
    this.g = new Array(81).fill(0);

    for (let i = 0; i < 81; i++) {
      const ch = str[i];
      const d = parseInt(ch, 10); // Standardize parsing
      if (!isNaN(d) && d >= 1 && d <= 9) {
        if (!this.canPlace(i, d)) {
          throw new Error(`Invalid puzzle: conflict at position ${i} (value: ${d})`);
        }
        this.set(i, d);
      }
    }
  }

  canPlace(i: number, d: number): boolean {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const bx = box(r, c);
    const m = bit(d);
    // Only check if the candidate is still available in the row AND col AND box constraints
    return (this.r[r] & m) !== 0 && (this.c[c] & m) !== 0 && (this.b[bx] & m) !== 0;
  }

  candidates(i: number): number {
    const r = Math.floor(i / 9);
    const c = i % 9;
    return this.r[r] & this.c[c] & this.b[box(r, c)];
  }

  set(i: number, d: number): void {
    const m = bit(d);
    const r = Math.floor(i / 9);
    const c = i % 9;
    const bx = box(r, c);
    this.r[r] ^= m;
    this.c[c] ^= m;
    this.b[bx] ^= m;
    this.g[i] = d;
  }

  unset(i: number, d: number): void {
    const m = bit(d);
    const r = Math.floor(i / 9);
    const c = i % 9;
    const bx = box(r, c);
    this.r[r] |= m;
    this.c[c] |= m;
    this.b[bx] |= m;
    this.g[i] = 0;
  }

  isValid(): boolean {
    for (let i = 0; i < 81; i++) {
      if (!this.g[i] && this.candidates(i) === 0) {
        return false;
      }
    }
    return true;
  }

  toString(): string {
    return this.g
      .map((v, i) => {
        const char = v || '.';
        return i % 9 === 8 ? char + '\n' : char;
      })
      .join('');
  }

  export(): string {
    return this.g.map((v) => (v ? v : '.')).join('');
  }
}
