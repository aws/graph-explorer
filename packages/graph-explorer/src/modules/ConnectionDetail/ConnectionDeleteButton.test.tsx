// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components";

import ConnectionDeleteButton from "./ConnectionDeleteButton";

function renderButton(saveCopy: () => boolean) {
  const deleteActiveConfig = vi.fn();
  render(
    <TooltipProvider>
      <ConnectionDeleteButton
        connectionName="Test Connection"
        isSync={false}
        deleteActiveConfig={deleteActiveConfig}
        saveCopy={saveCopy}
      />
    </TooltipProvider>,
  );
  return deleteActiveConfig;
}

describe("ConnectionDeleteButton", () => {
  it("deletes after saving a copy when the export succeeds", async () => {
    const user = userEvent.setup();
    const deleteActiveConfig = renderButton(() => true);

    await user.click(screen.getByRole("button", { name: "Delete connection" }));
    await user.click(
      screen.getByRole("button", { name: "Save a Copy & Delete" }),
    );

    expect(deleteActiveConfig).toHaveBeenCalledTimes(1);
  });

  it("does not delete when the copy export is refused", async () => {
    const user = userEvent.setup();
    const deleteActiveConfig = renderButton(() => false);

    await user.click(screen.getByRole("button", { name: "Delete connection" }));
    await user.click(
      screen.getByRole("button", { name: "Save a Copy & Delete" }),
    );

    expect(deleteActiveConfig).not.toHaveBeenCalled();
  });
});
