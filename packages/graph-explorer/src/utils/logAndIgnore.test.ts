import { logAndIgnore } from "./logAndIgnore";
import logger from "./logger";

vi.mock("./logger", () => ({
  default: {
    warn: vi.fn(),
  },
}));

describe("logAndIgnore", () => {
  it("warns with the error when used as a catch handler for a rejection", async () => {
    const error = new Error("persist failed");

    Promise.reject(error).catch(logAndIgnore);
    await vi.waitFor(() => {
      expect(logger.warn).toHaveBeenCalledWith(
        "Ignored promise rejection:",
        error,
      );
    });
  });

  it("does not log anything when the promise resolves", async () => {
    await Promise.resolve().catch(logAndIgnore);

    expect(logger.warn).not.toHaveBeenCalled();
  });
});
