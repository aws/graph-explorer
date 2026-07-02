// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { saveFile } from "@/utils/fileData";
import { TestProvider } from "@/utils/testing";

import SaveStylesButton from "./SaveStylesButton";

vi.mock("@/utils/fileData", () => ({
  toJsonFileData: vi.fn(() => new Blob(["{}"], { type: "application/json" })),
  fromFileToJson: vi.fn(),
  saveFile: vi.fn(),
}));

function renderButton() {
  const store = getAppStore();
  const queryClient = createQueryClient();
  render(
    <TestProvider client={queryClient} store={store}>
      <TooltipProvider>
        <SaveStylesButton />
      </TooltipProvider>
    </TestProvider>,
  );
  return store;
}

function saveButton() {
  return screen.getByRole("button", { name: "Save to File" });
}

describe("SaveStylesButton", () => {
  test("writes the styles file and shows no dialog on success", async () => {
    const user = userEvent.setup();
    vi.mocked(saveFile).mockResolvedValue(undefined);
    renderButton();

    await user.click(saveButton());

    expect(saveFile).toHaveBeenCalledWith(
      expect.any(Blob),
      "graph-explorer.styles.json",
      "Graph Explorer styles",
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  test("treats a dismissed save picker as a cancel, not a failure", async () => {
    const user = userEvent.setup();
    const abort = new Error("The user aborted a request.");
    abort.name = "AbortError";
    vi.mocked(saveFile).mockRejectedValue(abort);
    renderButton();

    await user.click(saveButton());

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  test("surfaces a humane error when the file cannot be saved", async () => {
    const user = userEvent.setup();
    vi.mocked(saveFile).mockRejectedValue(new Error("disk full"));
    renderButton();

    await user.click(saveButton());

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  });

  test("closes the dialog when the failure is dismissed", async () => {
    const user = userEvent.setup();
    vi.mocked(saveFile).mockRejectedValue(new Error("disk full"));
    renderButton();

    await user.click(saveButton());
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  test("never reveals an ancestor Suspense fallback while saving", async () => {
    const user = userEvent.setup();
    // Hold the save open so a non-transitioned dispatch would have time to
    // reveal the boundary while pending.
    vi.mocked(saveFile).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 20)),
    );
    const store = getAppStore();
    render(
      <TestProvider client={createQueryClient()} store={store}>
        <TooltipProvider>
          <Suspense fallback={<div>page loading</div>}>
            <SaveStylesButton />
          </Suspense>
        </TooltipProvider>
      </TestProvider>,
    );

    let fallbackSeen = false;
    const observer = new MutationObserver(() => {
      if (screen.queryByText("page loading")) fallbackSeen = true;
    });
    observer.observe(document.body, { childList: true, subtree: true });

    await user.click(saveButton());
    await vi.waitFor(() => expect(saveFile).toHaveBeenCalled());
    observer.disconnect();

    expect(fallbackSeen).toBe(false);
  });
});
