import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";

import { createRateLimiter } from "./rate-limiter.ts";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows calls up to the limit", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect([
      limiter.tryConsume(),
      limiter.tryConsume(),
      limiter.tryConsume(),
    ]).toStrictEqual([true, true, true]);
  });

  it("refuses the call after the limit within a window", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    limiter.tryConsume();
    limiter.tryConsume();
    expect(limiter.tryConsume()).toBe(false);
  });

  it("allows calls again once the window has passed", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.tryConsume();
    expect(limiter.tryConsume()).toBe(false);

    vi.advanceTimersByTime(1000);

    expect(limiter.tryConsume()).toBe(true);
  });

  it("keeps refusing until the full window has passed", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.tryConsume();

    vi.advanceTimersByTime(999);

    expect(limiter.tryConsume()).toBe(false);
  });
});
