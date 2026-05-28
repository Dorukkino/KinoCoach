import "server-only";

const PERF_ENABLED = process.env.PERF_LOGGING === "1";

export async function measureAction<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!PERF_ENABLED) return fn();

  const start = performance.now();
  try {
    return await fn();
  } finally {
    const ms = (performance.now() - start).toFixed(1);
    console.info(`[perf] ${label}: ${ms}ms`);
  }
}

export async function measureActionWithMeta<T>(
  label: string,
  fn: () => Promise<T>,
  meta?: Record<string, string | number>
): Promise<T> {
  if (!PERF_ENABLED) return fn();

  const start = performance.now();
  try {
    return await fn();
  } finally {
    const ms = (performance.now() - start).toFixed(1);
    const extra = meta
      ? ` ${Object.entries(meta)
          .map(([k, v]) => `${k}=${v}`)
          .join(" ")}`
      : "";
    console.info(`[perf] ${label}: ${ms}ms${extra}`);
  }
}
