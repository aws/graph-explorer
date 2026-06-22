// @vitest-environment happy-dom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";

import { TooltipProvider } from "@/components";
import { persistenceStatusStore } from "@/core/StateProvider/persistence";

import { PersistenceStatusIndicator } from "./PersistenceStatusIndicator";

function renderIndicator() {
  return render(<PersistenceStatusIndicator />, { wrapper: TooltipProvider });
}

// The indicator reads the app-wide singleton store. Return it to idle between
// tests by marking every key this suite touches as saved, which clears both
// in-flight and failed state for that key.
const KEYS_UNDER_TEST = ["configuration", "schema", "graph-sessions"];
afterEach(() => {
  act(() => {
    KEYS_UNDER_TEST.forEach(key => persistenceStatusStore.markSaved(key));
  });
});

function fail(key: string, reason: "terminal-quota" | "terminal-access") {
  act(() => persistenceStatusStore.markFailed(key, reason, 1));
}

describe("PersistenceStatusIndicator", () => {
  test("shows nothing while idle", () => {
    renderIndicator();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("shows nothing while a write is merely in flight", () => {
    renderIndicator();

    act(() => persistenceStatusStore.markSaving("configuration"));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("shows a standing alert when a write fails terminally", () => {
    renderIndicator();

    fail("configuration", "terminal-access");

    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t save/i);
  });

  test("opens a detail dialog from the Details button", async () => {
    const user = userEvent.setup();
    renderIndicator();

    fail("configuration", "terminal-access");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /details/i }));

    expect(screen.getByRole("dialog")).toHaveTextContent(/couldn.t save/i);
  });

  test("offers a backup in the dialog when storage is full", async () => {
    const user = userEvent.setup();
    renderIndicator();

    fail("graph-sessions", "terminal-quota");
    await user.click(screen.getByRole("button", { name: /details/i }));

    expect(
      screen.getByRole("button", { name: /download backup/i }),
    ).toBeInTheDocument();
  });

  test("offers no backup when storage is merely inaccessible", async () => {
    const user = userEvent.setup();
    renderIndicator();

    fail("configuration", "terminal-access");
    await user.click(screen.getByRole("button", { name: /details/i }));

    expect(
      screen.queryByRole("button", { name: /download backup/i }),
    ).not.toBeInTheDocument();
  });
});
