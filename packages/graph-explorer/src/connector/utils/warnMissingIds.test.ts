import { warnMissingIds } from "./warnMissingIds";

const logger = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock("@/utils", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, logger };
});

describe("warnMissingIds", () => {
  beforeEach(() => {
    logger.warn.mockClear();
  });

  it("does not warn when every requested id was found", () => {
    warnMissingIds("vertices", ["a", "b"], ["a", "b"], { data: 1 });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("warns with the requested ids and the missing ones", () => {
    warnMissingIds("edges", ["a", "b", "c"], ["a"], { data: 1 });
    expect(logger.warn).toHaveBeenCalledWith(
      "Did not find all requested edges",
      {
        requested: ["a", "b", "c"],
        missing: ["b", "c"],
        data: 1,
      },
    );
  });
});
