export type WorkerMessageType = 'generate' | 'cancel' | 'started' | 'progress' | 'complete' | 'cancelled' | 'error';

export interface GenerateMessage {
  type: 'generate';
  count: number;
  options?: any;
}

export interface CancelMessage {
  type: 'cancel';
}

export interface StartedMessage {
  type: 'started';
  count: number;
  timestamp: number;
}

export interface ProgressMessage {
  type: 'progress';
  current: number;
  total: number;
  percentage: number;
  elapsed: number;
  estimatedRemaining: number;
  rate: string;
  latestPuzzle?: string;
}

export interface CompleteMessage {
  type: 'complete';
  puzzles: string[];
  count: number;
  totalTime: number;
  averageTime: number;
}

export interface CancelledMessage {
  type: 'cancelled';
  completed: number;
  puzzles: string[];
}

export interface ErrorMessage {
  type: 'error';
  message: string;
  filename?: string;
  lineno?: number;
  continuing?: boolean;
}

export type IncomingWorkerMessage = GenerateMessage | CancelMessage;
export type OutgoingWorkerMessage = StartedMessage | ProgressMessage | CompleteMessage | CancelledMessage | ErrorMessage;
