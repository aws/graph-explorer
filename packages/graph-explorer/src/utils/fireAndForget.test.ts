import { fireAndForget } from "./fireAndForget";
import logger from "./logger";

vi.mock("./logger", () => ({
  default: {
    error: vi.fn(),
  },
}));

describe("fireAndForget", () => {
  it("logs the error when the promise rejects", async () => {
    const error = new Error("persist failed");

    fireAndForget(Promise.reject(error));
    await vi.waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith(error);
    });
  });

  it("does not log anything when the promise resolves", async () => {
    fireAndForget(Promise.resolve());
    await Promise.resolve();

    expect(logger.error).not.toHaveBeenCalled();
  });
});
