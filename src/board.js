// board.js - ALREADY MINIMAL
const ALL = 0x1ff;

export class Board {
  constructor(str) {
    this.r = new Uint16Array(9).fill(ALL);
    this.c = new Uint16Array(9).fill(ALL);
    this.b = new Uint16Array(9).fill(ALL);
    this.g = new Array(81).fill(0);

    for (let i = 0; i < 81; i++) {
      const ch = str[i];
      const d = +ch;
      if (d >= 1 && d <= 9) {
        if (!this.canPlace(i, d)) {
          throw new Error(`Invalid puzzle: conflict at position ${i}`);
        }
        this.set(i, d);
      }
    }
  }

  canPlace(i, d) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const bx = box(r, c);
    const m = bit(d);
    return (this.r[r] & m) && (this.c[c] & m) && (this.b[bx] & m);
  }

  candidates(i) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    return this.r[r] & this.c[c] & this.b[box(r, c)];
  }

  set(i, d) {
    const m = bit(d);
    const r = Math.floor(i / 9);
    const c = i % 9;
    const bx = box(r, c);
    this.r[r] ^= m;
    this.c[c] ^= m;
    this.b[bx] ^= m;
    this.g[i] = d;
  }

  unset(i, d) {
    const m = bit(d);
    const r = Math.floor(i / 9);
    const c = i % 9;
    const bx = box(r, c);
    this.r[r] |= m;
    this.c[c] |= m;
    this.b[bx] |= m;
    this.g[i] = 0;
  }

  isValid() {
    for (let i = 0; i < 81; i++) {
      if (!this.g[i] && this.candidates(i) === 0) {
        return false;
      }
    }
    return true;
  }

  toString() {
    return this.g
      .map((v, i) => (i % 9 === 8 ? (v || '.') + '\n' : v || '.'))
      .join('');
  }

  export() {
    return this.g.map((v) => (v ? v : '.')).join('');
  }
}

export const bit = (d) => 1 << (d - 1);
export const box = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);
export const idx = (r, c) => r * 9 + c;