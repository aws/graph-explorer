/**
 * Maps `callback` over `items` with at most `concurrency` promises in flight at
 * once. Unlike a fixed-batch barrier, the pool refills eagerly: the moment one
 * item settles the next pending item starts, so a single slow item never idles
 * the other lanes. Results are returned in the order of `items`.
 *
 * A rejected callback propagates: the returned promise rejects once any worker
 * throws (already-running callbacks are not cancelled), so callers get
 * full-failure semantics.
 *
 * @param items The items to process
 * @param concurrency The maximum number of callbacks running at once
 * @param callback The async operation to run for each item
 * @returns The results in the order of `items`
 */
export default async function mapWithConcurrency<Item, Result>(
  items: Item[],
  concurrency: number,
  callback: (item: Item) => Promise<Result>,
): Promise<Result[]> {
  const results: Result[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await callback(items[index]);
    }
  }

  const laneCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: laneCount }, worker));

  return results;
}
