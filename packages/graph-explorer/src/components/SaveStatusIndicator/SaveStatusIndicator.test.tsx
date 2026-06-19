// @vitest-environment happy-dom
import { act, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, test } from "vitest";

import { persistenceStatusStore } from "@/core/StateProvider/persistence";

import { SaveStatusIndicator } from "./SaveStatusIndicator";

// The indicator reads the app-wide singleton store. Return it to idle between
// tests by marking every key this suite touches as saved, which clears both
// in-flight and failed state for that key.
const KEYS_UNDER_TEST = ["configuration", "schema", "graph-sessions"];
afterEach(() => {
  act(() => {
    KEYS_UNDER_TEST.forEach(key => persistenceStatusStore.markSaved(key));
  });
});

describe("SaveStatusIndicator", () => {
  test("shows nothing while idle", () => {
    render(<SaveStatusIndicator />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("shows nothing while a write is merely in flight", () => {
    render(<SaveStatusIndicator />);

    act(() => persistenceStatusStore.markSaving("configuration"));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("shows a failure message when a write fails terminally", () => {
    render(<SaveStatusIndicator />);

    act(() =>
      persistenceStatusStore.markFailed("configuration", "terminal-access"),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t save/i);
  });

  test("prompts a backup when a write fails for lack of storage", () => {
    render(<SaveStatusIndicator />);

    act(() =>
      persistenceStatusStore.markFailed("graph-sessions", "terminal-quota"),
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Out of storage",
      expect.objectContaining({
        action: expect.objectContaining({ label: "Back up" }),
      }),
    );
  });

  test("does not prompt a backup for a non-quota failure", () => {
    render(<SaveStatusIndicator />);

    act(() =>
      persistenceStatusStore.markFailed("configuration", "terminal-access"),
    );

    expect(toast.error).not.toHaveBeenCalled();
  });
});
