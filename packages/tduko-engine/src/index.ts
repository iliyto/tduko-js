// packages/tduko-engine/src/index.ts

export { Board } from './core/Board';
export { solve, type SolveOptions, type SolveResult } from './core/Solver';
export { generateUniquePuzzle } from './core/Generator';

// Re-export specific worker types if needed, or helper functions to spawn workers
// For now, we keep it simple.
