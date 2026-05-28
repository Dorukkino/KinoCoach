import "server-only";

/** Max concurrent background batch operations against Supabase HTTP API */
const DEFAULT_CONCURRENCY = 3;

export async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize * concurrency) {
    const chunk = items.slice(i, i + batchSize * concurrency);
    const batches: T[][] = [];
    for (let j = 0; j < chunk.length; j += batchSize) {
      batches.push(chunk.slice(j, j + batchSize));
    }
    const batchResults = await Promise.all(
      batches.map(async (batch) => {
        const inner: R[] = [];
        for (const item of batch) {
          inner.push(await worker(item));
        }
        return inner;
      })
    );
    for (const inner of batchResults) {
      results.push(...inner);
    }
  }
  return results;
}

export function getBackgroundConcurrency(): number {
  const raw = process.env.BACKGROUND_BATCH_CONCURRENCY;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_CONCURRENCY;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CONCURRENCY;
}
