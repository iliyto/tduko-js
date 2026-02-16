import { describe, it, expect } from 'vitest';
import { Board } from '../src/core/Board';
import { solve } from '../src/core/Solver';
import { generateUniquePuzzle } from '../src/core/Generator';

describe('Subject: Board', () => {
  it('should parse a valid puzzle string', () => {
    const puzzle = '5.......7..2.6...8...9.4...2..7..1..3.......6..6..5..2...1.8...4...2.9..8.......5';
    const board = new Board(puzzle);
    expect(board.isValid()).toBe(true);
  });

  it('should detect invalid puzzles', () => {
    // Invalid because first row has two 5s (at index 0 and 1)
    const puzzle = '55......7..2.6...8...9.4...2..7..1..3.......6..6..5..2...1.8...4...2.9..8.......5';
    expect(() => new Board(puzzle)).toThrow();
  });

  it('should correctly identify candidates', () => {
    // Empty board
    const board = new Board('.'.repeat(81));
    // All candidates should be available for an empty cell
    const allCandidates = 0x1ff; // 111111111 in binary
    expect(board.candidates(0)).toBe(allCandidates);
  });
});

describe('Subject: Solver', () => {
  it('should solve a simple puzzle', () => {
    const puzzle = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
    const board = new Board(puzzle);
    const result = solve(board);
    expect(result.count).toBe(1);
    expect(result.solution).toBeTruthy();
    expect(result.solution).not.toContain('.');
  });

  it('should find multiple solutions if requested', () => {
    // Empty board has many solutions
    const board = new Board('.'.repeat(81));
    const result = solve(board, { stopAtFirst: false, maxSolutions: 5 });
    expect(result.count).toBe(5);
  });
});

describe('Subject: Generator', () => {
  it('should generate a valid puzzle', () => {
    const puzzle = generateUniquePuzzle();
    expect(puzzle).toHaveLength(81);
    const board = new Board(puzzle);
    expect(board.isValid()).toBe(true);
  });

  it('should generate a puzzle with a unique solution', () => {
    const puzzle = generateUniquePuzzle();
    const board = new Board(puzzle);
    const result = solve(board, { stopAtFirst: false, maxSolutions: 2 });
    expect(result.count).toBe(1);
  });
});
