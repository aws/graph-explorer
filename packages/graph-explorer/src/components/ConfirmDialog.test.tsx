// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { ConfirmDialogProvider, useConfirm } from "./ConfirmDialog";

function ConfirmTrigger({
  onResult,
}: {
  onResult: (confirmed: boolean) => void;
}) {
  const confirm = useConfirm();
  return (
    <button
      onClick={async () => {
        const result = await confirm({
          title: "Delete everything?",
          description: "This cannot be undone.",
          confirmLabel: "Delete",
          cancelLabel: "Keep",
        });
        onResult(result);
      }}
    >
      Open
    </button>
  );
}

function renderWithProvider(onResult: (confirmed: boolean) => void) {
  return render(
    <ConfirmDialogProvider>
      <ConfirmTrigger onResult={onResult} />
    </ConfirmDialogProvider>,
  );
}

describe("ConfirmDialogProvider", () => {
  test("resolves true when the user confirms", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    renderWithProvider(onResult);

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Delete everything?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onResult).toHaveBeenCalledWith(true);
    expect(screen.queryByText("Delete everything?")).not.toBeInTheDocument();
  });

  test("resolves false when the user cancels", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    renderWithProvider(onResult);

    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Keep" }));

    expect(onResult).toHaveBeenCalledWith(false);
    expect(screen.queryByText("Delete everything?")).not.toBeInTheDocument();
  });

  test("resolves false when the dialog is dismissed via escape", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    renderWithProvider(onResult);

    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.keyboard("{Escape}");

    expect(onResult).toHaveBeenCalledWith(false);
  });

  test("each confirmation resolves its own promise", async () => {
    const user = userEvent.setup();
    const results: boolean[] = [];
    renderWithProvider(confirmed => results.push(confirmed));

    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Keep" }));

    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(results).toEqual([false, true]);
  });

  test("useConfirm throws when used outside the provider", () => {
    function Orphan() {
      useConfirm();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(
      "useConfirm must be used within a ConfirmDialogProvider",
    );
    spy.mockRestore();
  });
});
