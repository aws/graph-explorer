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

// The indicator reads the app-wide singleton store, so reset it between tests.
afterEach(() => {
  act(() => persistenceStatusStore.reset());
});

function fail(key: string, reason: "terminal-quota" | "terminal-access") {
  act(() => persistenceStatusStore.markFailed(key, reason, 1));
}

describe("PersistenceStatusIndicator", () => {
  test("shows nothing while idle", () => {
    renderIndicator();

    expect(
      screen.queryByRole("button", { name: /changes not saved/i }),
    ).not.toBeInTheDocument();
  });

  test("shows nothing while a write is merely in flight", () => {
    renderIndicator();

    act(() => persistenceStatusStore.markSaving("configuration"));

    expect(
      screen.queryByRole("button", { name: /changes not saved/i }),
    ).not.toBeInTheDocument();
  });

  test("shows a standing indicator when a write fails terminally", () => {
    renderIndicator();

    fail("configuration", "terminal-access");

    expect(
      screen.getByRole("button", { name: /changes not saved/i }),
    ).toBeInTheDocument();
  });

  test("opens a detail dialog from the indicator", async () => {
    const user = userEvent.setup();
    renderIndicator();

    fail("configuration", "terminal-access");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /changes not saved/i }),
    );

    expect(screen.getByRole("dialog")).toHaveTextContent(/failed writes/i);
  });

  test("offers to save the configuration when storage is full", async () => {
    const user = userEvent.setup();
    renderIndicator();

    fail("graph-sessions", "terminal-quota");
    await user.click(
      screen.getByRole("button", { name: /changes not saved/i }),
    );

    expect(
      screen.getByRole("button", { name: /save configuration/i }),
    ).toBeInTheDocument();
  });

  test("offers no backup when storage is inaccessible", async () => {
    const user = userEvent.setup();
    renderIndicator();

    fail("configuration", "terminal-access");
    await user.click(
      screen.getByRole("button", { name: /changes not saved/i }),
    );

    expect(
      screen.queryByRole("button", { name: /save configuration/i }),
    ).not.toBeInTheDocument();
  });
});
