import { fireAndForget } from "./fireAndForget";
import logger from "./logger";

vi.mock("./logger", () => ({
  default: {
    warn: vi.fn(),
  },
}));

describe("fireAndForget", () => {
  it("warns with the error when the promise rejects", async () => {
    const error = new Error("persist failed");

    fireAndForget(Promise.reject(error));
    await vi.waitFor(() => {
      expect(logger.warn).toHaveBeenCalledWith(
        "Ignored promise rejection:",
        error,
      );
    });
  });

  it("does not log anything when the promise resolves", async () => {
    fireAndForget(Promise.resolve());
    await Promise.resolve();

    expect(logger.warn).not.toHaveBeenCalled();
  });
});
