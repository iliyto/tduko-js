// packages/tduko-engine/src/core/Solver.ts

import { Board, bit, idx } from './Board';

const MAX_COUNT = 100000;

export interface SolveOptions {
  stopAtFirst?: boolean;
  maxSolutions?: number;
}

export interface SolveResult {
  count: number;
  solution: string | null;
}

function popcnt(x: number): number {
  x = x - ((x >> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  return (((x + (x >> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

function propagate(b: Board): void {
  let changed: boolean;
  do {
    changed = false;
    for (let u = 0; u < 9; u++) {
      const checkUnit = (mask: number, fn: (i: number) => number) => {
        if (popcnt(mask) === 1) {
          const d = 31 - Math.clz32(mask); // Find the position of the single bit
          for (let i = 0; i < 9; i++) {
            const index = fn(i);
            if (!b.g[index] && (b.candidates(index) & bit(d + 1))) {
              b.set(index, d + 1);
              changed = true;
            }
          }
        }
      };
      checkUnit(b.r[u], (i) => idx(u, i));
      checkUnit(b.c[u], (i) => idx(i, u));
      const br = Math.floor(u / 3) * 3,
        bc = (u % 3) * 3;
      checkUnit(b.b[u], (i) => idx(br + Math.floor(i / 3), bc + (i % 3)));
    }
  } while (changed);
}

export function solve(b: Board, options: SolveOptions = {}): SolveResult {
  const stopAtFirst = options.stopAtFirst ?? true;
  const max = options.maxSolutions ?? MAX_COUNT;

  let count = 0;
  let solution: string | null = null;

  propagate(b);
  const empties = [...Array(81).keys()].filter((i) => !b.g[i]);

  function search(k: number): boolean {
    if (count >= max) return false;
    if (k === empties.length) {
      count++;
      solution = b.toString();
      return !stopAtFirst; // Continue if we want to count solutions
    }

    let best = k;
    let min = 10;

    // Find cell with minimum candidates (MRV heuristic)
    for (let i = k; i < empties.length; i++) {
      const n = popcnt(b.candidates(empties[i]));
      if (n < min) {
        min = n;
        best = i;
      }
      if (n === 1) break;
    }

    if (min === 0) return true; // Dead end

    // Swap the best cell to the current position k
    [empties[k], empties[best]] = [empties[best], empties[k]];

    const i = empties[k];
    const cands = b.candidates(i);

    for (let d = 1; d <= 9; d++) {
      if (cands & bit(d)) {
        b.set(i, d);
        if (!search(k + 1) && stopAtFirst) return false;
        b.unset(i, d);
      }
    }
    return true;
  }

  search(0);
  return { count, solution };
}
