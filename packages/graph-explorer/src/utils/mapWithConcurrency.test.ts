import mapWithConcurrency from "./mapWithConcurrency";

describe("mapWithConcurrency", () => {
  it("returns results in the order of the items, not completion order", async () => {
    const results = await mapWithConcurrency([30, 10, 20], 3, async ms => {
      await new Promise(r => setTimeout(r, ms));
      return ms;
    });

    expect(results).toEqual([30, 10, 20]);
  });

  it("never runs more than `concurrency` callbacks at once", async () => {
    let active = 0;
    let peak = 0;

    await mapWithConcurrency([...Array(12).keys()], 4, async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise(r => setTimeout(r, 5));
      active -= 1;
    });

    expect(peak).toBe(4);
  });

  it("refills a free lane immediately — a slow item does not stall the others", async () => {
    const completionOrder: number[] = [];
    // Lane budget of 2. Item 0 is slow and shares the first pair with item 1.
    const items = [
      { id: 0, ms: 100 },
      { id: 1, ms: 10 },
      { id: 2, ms: 10 },
      { id: 3, ms: 10 },
    ];

    await mapWithConcurrency(items, 2, async item => {
      await new Promise(r => setTimeout(r, item.ms));
      completionOrder.push(item.id);
      return item.id;
    });

    // A fixed-batch barrier would finish the slow item 0 before items 2 and 3
    // even start. The eager pool keeps the second lane pulling work, so all
    // three fast items complete before the slow one.
    expect(completionOrder).toEqual([1, 2, 3, 0]);
  });

  it("handles an empty list without running any callbacks", async () => {
    const callback = vi.fn();
    const results = await mapWithConcurrency([], 4, callback);

    expect(results).toEqual([]);
    expect(callback).not.toHaveBeenCalled();
  });

  it("propagates a rejection to the caller", async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, n =>
        n === 2 ? Promise.reject(new Error("boom")) : Promise.resolve(n),
      ),
    ).rejects.toThrow("boom");
  });
});
