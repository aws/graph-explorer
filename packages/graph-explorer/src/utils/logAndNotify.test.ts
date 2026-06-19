import { toast } from "sonner";

import { logAndNotify } from "./logAndNotify";
import logger from "./logger";

vi.mock("./logger", () => ({
  default: {
    warn: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
  },
}));

describe("logAndNotify", () => {
  it("logs the error and shows a warning toast when the promise rejects", async () => {
    const error = new Error("persist failed");
    const handler = logAndNotify("Couldn't save your changes.");

    await Promise.reject(error).catch(handler);

    expect(logger.warn).toHaveBeenCalledWith(
      "Couldn't save your changes.",
      error,
    );
    expect(toast.warning).toHaveBeenCalledWith(
      "Couldn't save your changes.",
      undefined,
    );
  });

  it("passes toast options through to the warning toast", async () => {
    const error = new Error("persist failed");
    const handler = logAndNotify("Couldn't save your changes.", {
      description: "Your edit may be lost when you reload.",
    });

    await Promise.reject(error).catch(handler);

    expect(toast.warning).toHaveBeenCalledWith("Couldn't save your changes.", {
      description: "Your edit may be lost when you reload.",
    });
  });

  it("does not log or notify when the promise resolves", async () => {
    await Promise.resolve().catch(logAndNotify("unused"));

    expect(logger.warn).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });
});
