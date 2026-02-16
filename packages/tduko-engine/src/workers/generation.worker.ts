// packages/tduko-engine/src/workers/generation.worker.ts
import { generateUniquePuzzle } from '../core/Generator';
import { GenerateMessage, CancelMessage } from '../types/worker-messages';

// Worker state
let cancelled = false;

// Worker message handler
self.onmessage = function (e: MessageEvent<GenerateMessage | CancelMessage>) {
  const { type } = e.data;

  if (type === 'generate') {
    const { count, options } = e.data as GenerateMessage;
    generatePuzzlesInWorker(count, options || {});
  } else if (type === 'cancel') {
    cancelled = true;
  }
};

function generatePuzzlesInWorker(count: number, options: any) {
  const startTime = Date.now();
  const puzzles: string[] = [];
  cancelled = false;

  // Send start message
  self.postMessage({
    type: 'started',
    count: count,
    timestamp: startTime
  });

  for (let i = 0; i < count; i++) {
    if (cancelled) {
      self.postMessage({
        type: 'cancelled',
        completed: i,
        puzzles: puzzles.slice() // Send what we have so far
      });
      return;
    }

    try {
      const puzzle = generateUniquePuzzle();
      puzzles.push(puzzle);

      // Send progress every 5 puzzles or on last puzzle
      if (i % 5 === 0 || i === count - 1) {
        const elapsed = Date.now() - startTime;
        const rate = ((i + 1) / elapsed) * 1000; // puzzles per second
        const estimated = count > 1 ? Math.round((count - i - 1) / rate) : 0;

        self.postMessage({
          type: 'progress',
          current: i + 1,
          total: count,
          percentage: Math.round(((i + 1) / count) * 100),
          elapsed: elapsed,
          estimatedRemaining: estimated,
          rate: rate.toFixed(2),
          latestPuzzle: puzzle.substring(0, 27) + '...' // First 27 chars for preview
        });
      }
    } catch (error: any) {
      // If individual puzzle generation fails, try again once
      try {
        const puzzle = generateUniquePuzzle();
        puzzles.push(puzzle);
      } catch (retryError: any) {
        // Skip this puzzle and continue
        self.postMessage({
          type: 'error',
          message: `Failed to generate puzzle ${i + 1}: ${retryError.message}`,
          continuing: true
        });
        continue;
      }
    }
  }

  // Send completion message
  const totalTime = Date.now() - startTime;
  self.postMessage({
    type: 'complete',
    puzzles: puzzles,
    count: puzzles.length,
    totalTime: totalTime,
    averageTime: totalTime / puzzles.length
  });
}

// Handle worker errors
self.addEventListener('error', (event) => {
  const errorEvent = event as ErrorEvent;
  self.postMessage({
    type: 'error',
    message: errorEvent.message || 'Unknown error',
    filename: errorEvent.filename,
    lineno: errorEvent.lineno
  });
});
