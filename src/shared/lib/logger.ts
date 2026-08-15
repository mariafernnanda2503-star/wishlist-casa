export type LogContext = Record<string, boolean | number | string | null | undefined>;
type LogLevel = "debug" | "info" | "success" | "warn" | "error";

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;
    return {
      name: typeof candidate.name === "string" ? candidate.name : undefined,
      message: typeof candidate.message === "string" ? candidate.message : "Erro desconhecido",
      code: typeof candidate.code === "string" ? candidate.code : undefined,
    };
  }

  return { message: String(error) };
}

function entry(level: LogLevel, event: string, context: LogContext, error?: unknown) {
  return {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
    ...(error === undefined ? {} : { error: normalizeError(error) }),
  };
}

export const logger = {
  debug(event: string, context: LogContext = {}) {
    if (process.env.NODE_ENV !== "production") console.debug(entry("debug", event, context));
  },
  info(event: string, context: LogContext = {}) {
    console.info(entry("info", event, context));
  },
  success(event: string, context: LogContext = {}) {
    console.info(entry("success", event, context));
  },
  warn(event: string, context: LogContext = {}, error?: unknown) {
    console.warn(entry("warn", event, context, error));
  },
  error(event: string, error: unknown, context: LogContext = {}) {
    console.error(entry("error", event, context, error));
  },
};
