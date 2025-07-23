# Sudoku Generator + Solver

A minimal yet powerful Sudoku puzzle generator and solver implementation in JavaScript.

## Features
- Generates unique Sudoku puzzles with varying difficulty
- Solves puzzles using optimized backtracking algorithm
- Counts number of solutions for a given puzzle
- Web-based UI with progress tracking
- Export results in TXT and CSV formats

## Implementation

### Algorithm
Inspired by the article ["Nerd Sniped: A Sudoku Story"](https://t-dillon.github.io/tdoku/) by [T-Dillon](https://github.com/t-dillon/tdoku/), this implementation uses:
- Bitwise operations to track cell candidates
- Efficient backtracking with constraint propagation
- Recursive depth-first search with pruning

### Browser Features
- Web Workers for parallel puzzle generation
- Responsive UI that works on mobile and desktop
- Real-time progress tracking
- Clipboard export functionality

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Open `http://localhost:3000` in your browser

## Project Structure

```
├── src/
│   ├── board.js       - Bitboard implementation and core Sudoku logic
│   ├── solver.js      - Backtracking solver with pruning
│   ├── puzzleGenerator.js - Puzzle generation logic
│   ├── worker.js      - WebWorker for parallel generation
│   └── main.js        - UI and coordination logic
├── index.html         - Main application interface
```

## Cleanup Suggestions

1. Add unit tests (could use Jest or similar framework)
2. Implement CI/CD pipeline (GitHub Actions)
3. Add ESLint/Prettier config for consistent code style
4. Consider adding difficulty level controls
5. Improve mobile UI/UX with dedicated styling

## Credits

Special thanks to:
- [T-Dillon's Sudoku Solver Article](https://t-dillon.github.io/tdoku/) for algorithm inspiration
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/) for client-side export functionality

## License

MIT License