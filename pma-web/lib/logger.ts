/**
 * lib/logger.ts — Structured request logger
 * PRD §7.2: "Request IDs and timing logged", "Structured logging enabled from day one"
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  requestId?: string;
  message: string;
  durationMs?: number;
  [key: string]: unknown;
}

function emit(entry: LogEntry) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...entry,
  });
  if (entry.level === "error") {
    console.error(line);
  } else if (entry.level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const log = {
  info(message: string, meta: Omit<LogEntry, "level" | "message"> = {}) {
    emit({ level: "info", message, ...meta });
  },
  warn(message: string, meta: Omit<LogEntry, "level" | "message"> = {}) {
    emit({ level: "warn", message, ...meta });
  },
  error(message: string, meta: Omit<LogEntry, "level" | "message"> = {}) {
    emit({ level: "error", message, ...meta });
  },
};

/**
 * Wraps a route handler to automatically log incoming request + timing.
 * Usage: export const GET = withLogging("GET /api/jobs/search", handler)
 */
export function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}
