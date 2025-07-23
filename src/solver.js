// solver.js - MINIMAL PRODUCTION VERSION
import { Board, bit, box, idx } from './board.js';

const MAX_COUNT = 100000;

function popcnt(x) {
  x = x - ((x >> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  return (((x + (x >> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

function propagate(b) {
  let changed;
  do {
    changed = false;
    for (let u = 0; u < 9; u++) {
      const checkUnit = (mask, fn) => {
        if (popcnt(mask) === 1) {
          const d = 31 - Math.clz32(mask);
          for (let i = 0; i < 9; i++) {
            const index = fn(i);
            if (!b.g[index] && b.candidates(index) & bit(d + 1)) {
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

export function solve(b, stopAtFirst = true, max = MAX_COUNT) {
  let count = 0, sol = null;
  propagate(b);
  const empties = [...Array(81).keys()].filter((i) => !b.g[i]);

  function search(k) {
    if (count >= max) return false;
    if (k === empties.length) {
      count++;
      sol = b.toString();
      return !stopAtFirst;
    }
    let best = k, min = 10;
    for (let i = k; i < empties.length; i++) {
      const n = popcnt(b.candidates(empties[i]));
      if (n < min) {
        min = n;
        best = i;
      }
      if (n === 1) break;
    }
    if (min === 0) return true;
    [empties[k], empties[best]] = [empties[best], empties[k]];
    const i = empties[k], cands = b.candidates(i);
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
  return { count, sol };
}