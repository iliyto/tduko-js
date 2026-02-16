// packages/tduko-engine/src/core/Generator.ts

import { Board } from './Board';
import { solve } from './Solver';

/**
 * Counts the number of solutions for a given puzzle string.
 * @param {string} puzzleString - The puzzle to solve.
 * @param {number} maxSolutions - The maximum number of solutions to find.
 * @returns {number} The number of solutions found (up to maxSolutions).
 */
function countSolutions(puzzleString: string, maxSolutions: number = 2): number {
  try {
    const board = new Board(puzzleString);
    if (!board.isValid()) return 0;
    const result = solve(board, { stopAtFirst: false, maxSolutions });
    return Math.min(result.count, maxSolutions);
  } catch {
    return 0;
  }
}

/**
 * Creates a fully solved Sudoku grid.
 * @returns {string} A string representing the solved grid.
 */
function createFullGrid(): string {
  const b = new Board('.'.repeat(81));
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 9; i++) {
    b.set(i, digits[i]);
  }
  solve(b, { stopAtFirst: true, maxSolutions: 1 });
  return b.export();
}

/**
 * Generates a Sudoku puzzle with a unique solution.
 * It starts with a full grid and removes clues one by one.
 * @returns {string} A string representing the generated puzzle.
 */
export function generateUniquePuzzle(): string {
  const solvedGrid = createFullGrid();
  const puzzle = solvedGrid.split('');

  const cluePositions = [...Array(81).keys()].sort(() => Math.random() - 0.5);

  for (const pos of cluePositions) {
    const currentClues = puzzle.filter(c => c !== '.').length;
    if (currentClues <= 17) break; // Minimum clues for a unique puzzle

    const originalValue = puzzle[pos];
    puzzle[pos] = '.';

    if (countSolutions(puzzle.join(''), 2) !== 1) {
      puzzle[pos] = originalValue; // Put it back if solution is not unique
    }
  }

  return puzzle.join('');
}
