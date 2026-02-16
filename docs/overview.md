# Project Overview: Tduko-JS

## Executive Summary
**Tduko-JS** is a high-performance, browser-based Sudoku generator and solver. It leverages modern JavaScript features (ES Modules, Web Workers) and efficient bitwise operations to provide a fast and responsive user experience. The application is built with a focus on core algorithm efficiency, using a backtracking solver with constraint propagation and Minimum Remaining Values (MRV) heuristic.

## Architecture

### 1. Core Logic (`src/board.js`, `src/solver.js`)
The core of the application is the `Board` class and the `solve` function.
-   **Bitboard Representation**: The `Board` class uses `Uint16Array` to represent the state of rows, columns, and 3x3 boxes. Each cell's candidates are tracked using a 9-bit mask (`0x1FF`), allowing for extremely fast constraint checking and updates.
-   **Backtracking Solver**: The `solve` function implements a recursive backtracking algorithm.
    -   **Constraint Propagation**: Before guessing, the solver propagates constraints to eliminate impossible candidates, significantly reducing the search space.
    -   **MRV Heuristic**: The solver selects the cell with the fewest remaining candidates to fill next, which minimizes the branching factor.
    -   **Optimization**: It uses a `popcnt` (population count) function to quickly determine the number of candidates for a cell.

### 2. Puzzle Generation (`src/puzzleGenerator.js`)
Puzzle generation ensures uniqueness and validity.
-   **Full Grid Creation**: It starts by generating a complete, valid Sudoku grid using a randomized solver.
-   **Clue Removal**: It iteratively removes numbers from the grid.
-   **Uniqueness Check**: After removing a number, it verifies that the puzzle still has exactly one solution. If removing a number introduces multiple solutions, the number is put back. This guarantees that all generated puzzles are well-formed.

### 3. Concurrency (`src/worker.js`)
To prevent UI freezing during intensive generation tasks, Tduko-JS utilizes Web Workers.
-   **Parallel Generation**: The `worker.js` script runs the generation logic in a background thread.
-   **Message Passing**: The main thread communicates with the worker via `postMessage`, sending commands (`generate`, `cancel`) and receiving progress updates and results.
-   **Scalability**: The system is designed to potentially utilize multiple workers (partitioning the workload), though the current implementation primarily focuses on offloading the main thread.

### 4. User Interface (`src/main.js`, `index.html`)
The UI is simple, clean, and responsive.
-   **Main Controller**: `main.js` orchestrates the application flow. It handles user input, manages the worker lifecycle, and updates the DOM with results.
-   **Interactive Features**:
    -   Real-time progress bars for generation.
    -   Ability to cancel ongoing operations.
    -   Export results to TXT or CSV.
    -   Clipboard integration.
-   **Design**: The interface uses standard HTML/CSS with a focus on readability and usability. It includes responsive design elements for mobile compatibility.

## Key Features
-   **Fast Solving**: Solves even hard puzzles in milliseconds.
-   **Unique Generation**: Guarantees puzzles with a single unique solution.
-   **Mobile-Friendly**: Responsive layout adapts to different screen sizes.
-   **Export Options**: easy data export for analysis or sharing.
-   **No External Dependencies (Runtime)**: the core logic is pure vanilla JavaScript, ensuring lightweight execution. `Vite` is used only for the development environment.

## Code Quality & Status
-   **Modular**: The code is well-organized into ES modules, separating concerns (logic vs. UI vs. worker).
-   **Efficient**: Use of bitwise operators and typed arrays demonstrates a focus on performance.
-   **Maintainable**: Clear variable naming and structure.
-   **Potential Improvements**:
    -   **Testing**: Currently lacks a comprehensive test suite (Unit/E2E).
    -   **Error Handling**: Worker error handling is basic and could be more robust.
    -   **Styles**: CSS is currently embedded in `index.html`; extracting to a separate file or using a preprocessor would improve maintainability.

## Conclusion
Tduko-JS is a robust example of how to build performant, computation-heavy applications in the browser. Its use of efficient algorithms and web workers makes it a capable tool for Sudoku enthusiasts and a good reference for similar projects.
