import { chunk } from "lodash";

/**
 * Performs the given operation on the collection of items in groups of
 * concurrent requests. A batch group must complete entirely before progressing
 * to the next group.
 *
 * @param items The array of items that will be passed to the callback
 * @param batchSize The size of the batch groups
 * @param callback The async operation to perform on the given item
 * @returns The results of all the operations performed on the given items in
 * the order of the items array.
 */
export default async function batchPromisesSerially<Item, Result>(
  items: Item[],
  batchSize: number,
  callback: (item: Item) => Promise<Result>,
): Promise<Result[]> {
  const batches = chunk(items, batchSize);
  const results = new Array<Result>();

  for (const batch of batches) {
    const batchResults = await Promise.all(batch.map(callback));
    results.push(...batchResults);
  }

  return results;
}
