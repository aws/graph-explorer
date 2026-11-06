import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";

import { formatRelativeDate } from "./formatRelativeDate";

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-03-05T14:07:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("describes a past date with an ago suffix", () => {
    expect(formatRelativeDate(new Date("2024-03-02T14:07:00Z"))).toBe(
      "3 days ago",
    );
  });

  it("describes a future date with an in prefix", () => {
    expect(formatRelativeDate(new Date("2024-03-05T16:07:00Z"))).toBe(
      "in about 2 hours",
    );
  });
});
