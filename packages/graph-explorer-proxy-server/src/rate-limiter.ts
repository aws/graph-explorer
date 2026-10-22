export interface RateLimiter {
  /** Records one call and returns false when the window's limit is already reached. */
  tryConsume(): boolean;
}

/**
 * Allows up to `limit` calls per fixed window of `windowMs`. The first window
 * opens at creation, and each later one opens on the first call after the
 * previous one expires.
 */
export function createRateLimiter({
  limit,
  windowMs,
}: {
  limit: number;
  windowMs: number;
}): RateLimiter {
  let windowStart = Date.now();
  let count = 0;

  return {
    tryConsume() {
      const now = Date.now();
      if (now - windowStart >= windowMs) {
        windowStart = now;
        count = 0;
      }
      if (count >= limit) {
        return false;
      }
      count++;
      return true;
    },
  };
}
