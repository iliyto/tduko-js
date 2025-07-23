// main.js - FIXED WITH PROPER EVENT LISTENER MANAGEMENT
import { Board } from './board.js';
import { solve } from './solver.js';
import { generateUniquePuzzle } from './puzzleGenerator.js';

let allResults = [];
let displayedCount = 20;
let generationWorkers = [];
let isGenerating = false;

function run() {
  const lines = document.getElementById('input').value.trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    document.getElementById('summary').textContent = 'No puzzles to solve.';
    document.getElementById('log').textContent = '';
    document.getElementById('controls').style.display = 'none';
    return;
  }

  const mode = document.querySelector('input[name="mode"]:checked').value;
  const summary = document.getElementById('summary');
  const log = document.getElementById('log');
  const controls = document.getElementById('controls');

  // Reset state
  allResults = [];
  displayedCount = 20;
  log.textContent = '';
  controls.style.display = 'none';

  let total = 0, solved = 0, errors = 0;
  const t0 = performance.now();

  lines.forEach((ln, i) => {
    const str = ln.replace(/[^1-9.]/g, '').padEnd(81, '.').slice(0, 81);

    let result = {
      index: i + 1,
      status: '',
      content: '',
      rawPuzzle: str,
      solutionCount: 0,
      clueCount: str.split('').filter(c => c !== '.').length,
      isError: false
    };

    if (str.length !== 81 || str === '.'.repeat(81)) {
      result.status = '❌';
      result.content = 'Invalid puzzle';
      result.isError = true;
      errors++;
      allResults.push(result);
      return;
    }

    try {
      const b = new Board(str);
      if (!b.isValid()) {
        result.status = '❌';
        result.content = 'Impossible puzzle';
        result.isError = true;
        errors++;
        allResults.push(result);
        return;
      }

      const { count, sol } = solve(b, mode === 'solve', mode === 'solve' ? 1 : 100000);
      total += count;
      result.solutionCount = count;

      if (count > 0) solved++;

      if (mode === 'solve') {
        if (sol) {
          result.status = '✅';
          result.content = sol;
          result.solution = sol.replace(/\n/g, '');
        } else {
          result.status = '❌';
          result.content = 'No solution found';
          result.isError = true;
        }
      } else {
        result.status = count === 0 ? '❌' : count === 1 ? '✅' : '⚠️';
        result.content = `${count} solution${count !== 1 ? 's' : ''}`;
      }

      allResults.push(result);
    } catch (error) {
      result.status = '❌';
      result.content = error.message;
      result.isError = true;
      errors++;
      allResults.push(result);
    }
  });

  const ms = (performance.now() - t0).toFixed(2);
  summary.textContent = `${lines.length} processed | ${solved} solved | ${errors} errors | ${ms} ms`;

  renderResults();
  updateControls();
}

// FIXED: Single unified generate/cancel handler
function handleGenerateClick() {
    if (isGenerating) {
        cancelGeneration();
        return;
    }

    const count = Math.max(1, parseInt(document.getElementById('generateCount').value) || 1);

    if (typeof Worker !== 'undefined') {
        startWorkerGeneration(count);
    } else {
        console.warn('Web Workers not supported, falling back to main thread.');
        fallbackGeneration(count);
    }
}



function startWorkerGeneration(totalPuzzles) {
    if (isGenerating) return;
    isGenerating = true;

    const numWorkers = Math.max(1, Math.min(12, navigator.hardwareConcurrency || 4));
    let workersFinished = 0;
    let allPuzzles = [];
    let progressPerWorker = new Array(numWorkers).fill(0);

    showGenerationUI(totalPuzzles);

    let puzzlesAssigned = 0;
    for (let i = 0; i < numWorkers; i++) {
        const worker = new Worker('./src/worker.js', { type: 'module' });
        generationWorkers.push(worker);

        worker.onmessage = (e) => handleWorkerMessage(e, worker, i);
        worker.onerror = (e) => handleWorkerError(e, worker, i);

        const remainingPuzzles = totalPuzzles - puzzlesAssigned;
        const remainingWorkers = numWorkers - i;
        const countForThisWorker = Math.ceil(remainingPuzzles / remainingWorkers);
        
        puzzlesAssigned += countForThisWorker;

        if (countForThisWorker > 0) {
            worker.postMessage({ type: 'generate', count: countForThisWorker });
        } else {
            workersFinished++;
        }
    }

    if (workersFinished === numWorkers) {
        finishGeneration([], false, 0);
        return;
    }

    const generationStartTime = performance.now();

    function handleWorkerMessage(e, worker, workerId) {
        if (!isGenerating) return;

        const { type, puzzles } = e.data;

        switch (type) {
            case 'progress':
                progressPerWorker[workerId] = e.data.current;
                const currentTotalProgress = progressPerWorker.reduce((acc, p) => acc + p, 0);
                updateGenerationProgress(currentTotalProgress, totalPuzzles, (performance.now() - generationStartTime), e.data);
                break;

            case 'complete':
                allPuzzles.push(...puzzles);
                progressPerWorker[workerId] = puzzles.length;
                workersFinished++;

                if (workersFinished === numWorkers) {
                    const finalTotalProgress = progressPerWorker.reduce((acc, p) => acc + p, 0);
                    updateGenerationProgress(finalTotalProgress, totalPuzzles, (performance.now() - generationStartTime), { latest: puzzles.length > 0 ? puzzles[puzzles.length - 1] : undefined });
                    finishGeneration(allPuzzles, false, performance.now() - generationStartTime);
                }
                break;

            case 'cancelled':
                allPuzzles.push(...puzzles);
                workersFinished++;
                if (workersFinished === numWorkers) {
                    finishGeneration(allPuzzles, true);
                }
                break;
        }
    }

    function handleWorkerError(e, worker, workerId) {
        console.error(`Worker ${workerId} error:`, e);
        workersFinished++;
        if (workersFinished === numWorkers) {
            finishGeneration(allPuzzles, false);
        }
    }
}





function cancelGeneration() {
    if (!isGenerating) return;

    generationWorkers.forEach(worker => {
        try {
            worker.postMessage({ type: 'cancel' });
            worker.terminate();
        } catch (e) {
            console.warn('Error terminating worker:', e);
        }
    });

    resetGenerationState();
    hideGenerationUI();
    document.getElementById('summary').textContent = 'Generation cancelled by user.';
}

function resetGenerationState() {
    isGenerating = false;
    generationWorkers.forEach(worker => {
        try {
            worker.terminate();
        } catch (e) { /* Ignore */ }
    });
    generationWorkers = [];
}

function fallbackGeneration(count) {
    console.log('Using fallback main thread generation');
    hideGenerationUI();
    showGenerationUI(count);

    const startTime = performance.now();
    document.getElementById('summary').textContent = `Generating ${count} puzzles (fallback mode)...`;

    setTimeout(() => {
        try {
            const puzzles = [];
            for (let i = 0; i < count; i++) {
                puzzles.push(generateUniquePuzzle());
                updateGenerationProgress(i + 1, count, (performance.now() - startTime));
            }
            finishGeneration(puzzles, false, performance.now() - startTime);
        } catch (error) {
            document.getElementById('summary').textContent = `Generation failed: ${error.message}`;
            resetGenerationState();
            hideGenerationUI();
        }
    }, 10);
}

// FIXED: Only update UI, don't touch event listeners
function showGenerationUI(count) {
  const generateBtn = document.getElementById('generateBtn');
  const progressDiv = document.getElementById('generationProgress');

  // FIXED: Only change visual state, preserve event listeners
  generateBtn.textContent = 'Cancel';
  generateBtn.className = 'cancel'; // Add CSS class for styling

  progressDiv.style.display = 'block';
  document.getElementById('progressTotal').textContent = count;

  // Reset progress display
  updateGenerationProgress(0, count, 0, '∞', '0.00', 'Starting...');
}

// FIXED: Only update UI, don't touch event listeners
function hideGenerationUI() {
  const generateBtn = document.getElementById('generateBtn');
  const progressDiv = document.getElementById('generationProgress');

  // FIXED: Only change visual state, preserve event listeners
  generateBtn.textContent = 'Generate';
  generateBtn.className = ''; // Remove cancel class

  progressDiv.style.display = 'none';
}

function updateGenerationProgress(current, total, elapsed, workerProgress = {}) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    document.getElementById('progressCurrent').textContent = current;
    document.getElementById('progressTotal').textContent = total;
    document.getElementById('progressPercent').textContent = percentage;
    document.getElementById('progressBar').style.width = percentage + '%';

    const rate = elapsed > 0 ? (current / elapsed * 1000) : 0;
    const remainingPuzzles = total - current;
    const estimatedMs = rate > 0 ? (remainingPuzzles / rate) : 0;
    const estimatedSec = Math.round(estimatedMs / 1000);

    if (rate > 0 && isFinite(estimatedSec)) {
        const timeText = estimatedSec > 60
            ? `${Math.floor(estimatedSec / 60)}m ${estimatedSec % 60}s`
            : `${estimatedSec}s`;
        document.getElementById('timeRemaining').textContent = timeText;
    } else {
        document.getElementById('timeRemaining').textContent = '∞';
    }

    document.getElementById('generationRate').textContent = `${rate.toFixed(2)}/s`;

    if (workerProgress.latestPuzzle) {
        document.getElementById('currentPuzzle').textContent = workerProgress.latestPuzzle;
    }
}

function finishGeneration(puzzles, wasCancelled, totalTime) {
  resetGenerationState();
  hideGenerationUI();

  if (puzzles && puzzles.length > 0) {
    document.getElementById('input').value = puzzles.join('\n');

    if (wasCancelled) {
      document.getElementById('summary').textContent = `Generated ${puzzles.length} puzzles (cancelled by user)`;
    } else if (totalTime) {
      const avgTime = (totalTime / puzzles.length).toFixed(1);
      document.getElementById('summary').textContent =
        `Generated ${puzzles.length} puzzles in ${(totalTime / 1000).toFixed(1)}s (avg ${avgTime}ms each)`;
    } else {
      document.getElementById('summary').textContent = `Generated ${puzzles.length} puzzles`;
    }
  } else {
    document.getElementById('summary').textContent = 'Generation failed - no puzzles created';
  }

  // Clear any controls from previous runs
  document.getElementById('controls').style.display = 'none';
}

// EXISTING FUNCTIONS (unchanged)
function renderResults() {
  const log = document.getElementById('log');
  const toShow = Math.min(displayedCount, allResults.length);

  const resultLines = [];

  for (let i = 0; i < toShow; i++) {
    const result = allResults[i];

    if (result.content.includes('\n')) {
      resultLines.push(`#${result.index} ${result.status}`);
      resultLines.push(formatSudokuGrid(result.content));
      resultLines.push(`Raw: ${result.rawPuzzle}`);
    } else {
      resultLines.push(`#${result.index} ${result.status} ${result.content}`);
      if (result.rawPuzzle && !result.isError) {
        resultLines.push(`     ${formatCompactGrid(result.rawPuzzle)}`);
      }
    }
  }

  log.textContent = resultLines.join('\n\n');
}

function formatSudokuGrid(solution) {
  const lines = solution.trim().split('\n');
  const formatted = [];

  for (let i = 0; i < 9; i++) {
    const row = lines[i] || '';
    const cells = row.padEnd(9, '.').slice(0, 9);

    let formattedRow = '';
    for (let j = 0; j < 9; j++) {
      formattedRow += cells[j] === '.' ? '·' : cells[j];
      if (j === 2 || j === 5) formattedRow += ' │ ';
      else if (j < 8) formattedRow += ' ';
    }

    formatted.push(formattedRow);

    if (i === 2 || i === 5) {
      formatted.push('──────┼───────┼──────');
    }
  }

  return formatted.join('\n');
}

function formatCompactGrid(puzzle) {
  let formatted = '';
  for (let i = 0; i < 81; i++) {
    formatted += puzzle[i] === '.' ? '·' : puzzle[i];
    if ((i + 1) % 9 === 0 && i < 80) formatted += ' ';
  }
  return formatted;
}

function updateControls() {
  const controls = document.getElementById('controls');
  const showMoreBtn = document.getElementById('showMoreBtn');
  const resultInfo = document.getElementById('resultInfo');

  if (allResults.length === 0) {
    controls.style.display = 'none';
    return;
  }

  controls.style.display = 'flex';

  resultInfo.textContent = `Showing ${Math.min(displayedCount, allResults.length)} of ${allResults.length} results`;

  if (displayedCount >= allResults.length) {
    showMoreBtn.style.display = 'none';
  } else {
    showMoreBtn.style.display = 'inline-block';
    const remaining = allResults.length - displayedCount;
    showMoreBtn.textContent = `Show ${Math.min(20, remaining)} More`;
  }
}

function showMore() {
  displayedCount += 20;
  renderResults();
  updateControls();
}

// Export functions (unchanged but with better error handling)
function exportTXT() {
  if (allResults.length === 0) {
    document.getElementById('summary').textContent = 'No results to export';
    return;
  }

  try {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    let content = '';

    if (mode === 'solve') {
      content = allResults
        .filter(r => !r.isError)
        .map(r => {
          if (r.solution) {
            return `# Puzzle ${r.index} (${r.clueCount} clues)\nPuzzle: ${r.rawPuzzle}\nSolution: ${r.solution}`;
          } else {
            return `# Puzzle ${r.index} (${r.clueCount} clues)\nPuzzle: ${r.rawPuzzle}\nSolution: ${r.solutionCount} solutions`;
          }
        })
        .join('\n\n');
    } else {
      content = allResults
        .filter(r => !r.isError)
        .map(r => r.rawPuzzle)
        .join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const filename = `sudoku-${mode}-${new Date().toISOString().split('T')[0]}.txt`;
    saveAs(blob, filename);
  } catch (error) {
    console.error('Export failed:', error);
    document.getElementById('summary').textContent = `Export failed: ${error.message}`;
  }
}

function exportCSV() {
  if (allResults.length === 0) {
    document.getElementById('summary').textContent = 'No results to export';
    return;
  }

  try {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    let csvContent = '';

    if (mode === 'solve') {
      csvContent = 'Index,Status,Clues,Puzzle,Solution,SolutionCount\n';
      csvContent += allResults.map(r => {
        const status = r.status.replace(/[❌✅⚠️]/g, r => ({
          '❌': 'ERROR',
          '✅': 'SOLVED',
          '⚠️': 'MULTIPLE'
        }[r] || 'UNKNOWN'));

        const solution = r.solution || '';
        const puzzle = r.rawPuzzle || '';

        return `${r.index},"${status}",${r.clueCount},"${puzzle}","${solution}",${r.solutionCount}`;
      }).join('\n');
    } else {
      csvContent = 'Index,Status,Clues,Puzzle,SolutionCount\n';
      csvContent += allResults.map(r => {
        const status = r.status.replace(/[❌✅⚠️]/g, r => ({
          '❌': 'ERROR',
          '✅': 'UNIQUE',
          '⚠️': 'MULTIPLE'
        }[r] || 'UNKNOWN'));

        const puzzle = r.rawPuzzle || '';

        return `${r.index},"${status}",${r.clueCount},"${puzzle}",${r.solutionCount}`;
      }).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const filename = `sudoku-${mode}-${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, filename);
  } catch (error) {
    console.error('Export failed:', error);
    document.getElementById('summary').textContent = `Export failed: ${error.message}`;
  }
}

function copyToClipboard() {
  if (allResults.length === 0) {
    document.getElementById('summary').textContent = 'No results to copy';
    return;
  }

  try {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    let content = '';

    if (mode === 'solve') {
      content = allResults
        .filter(r => r.solution)
        .map(r => r.solution)
        .join('\n');
    } else {
      content = allResults
        .filter(r => !r.isError)
        .map(r => r.rawPuzzle)
        .join('\n');
    }

    navigator.clipboard.writeText(content).then(() => {
      const copyBtn = document.getElementById('copyBtn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅ Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    }).catch(() => {
      const copyBtn = document.getElementById('copyBtn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '❌ Failed';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    });
  } catch (error) {
    console.error('Copy failed:', error);
    document.getElementById('summary').textContent = `Copy failed: ${error.message}`;
  }
}

// FIXED: Proper event listener setup - only addEventListener, no onclick
document.addEventListener('DOMContentLoaded', function () {
  // Set up all event listeners once
  document.getElementById('generateBtn').addEventListener('click', handleGenerateClick);
  document.getElementById('runBtn').addEventListener('click', run);
  document.getElementById('showMoreBtn').addEventListener('click', showMore);
  document.getElementById('exportTxtBtn').addEventListener('click', exportTXT);
  document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
  document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
});