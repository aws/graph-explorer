// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { TooltipProvider } from "@/components";
import { getAppStore, userEdgeStylesAtom, userVertexStylesAtom } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { DbState, TestProvider } from "@/utils/testing";

import ResetStylesButton from "./ResetStylesButton";

function renderButton(state = new DbState()) {
  const store = getAppStore();
  state.applyTo(store);
  const queryClient = createQueryClient();
  render(
    <TestProvider client={queryClient} store={store}>
      <TooltipProvider>
        <ResetStylesButton />
      </TooltipProvider>
    </TestProvider>,
  );
  return store;
}

function triggerButton() {
  return screen.getByRole("button", { name: "Reset" });
}

describe("ResetStylesButton", () => {
  test("renders a trigger button", () => {
    renderButton();
    expect(triggerButton()).toBeInTheDocument();
  });

  test("opens a confirmation dialog when clicked", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(triggerButton());

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  test("clears all styles when confirmed", async () => {
    const user = userEvent.setup();
    const store = renderButton();

    await user.click(triggerButton());
    await user.click(screen.getByRole("button", { name: "Reset to Defaults" }));

    expect(store.get(userVertexStylesAtom)).toStrictEqual(new Map());
    expect(store.get(userEdgeStylesAtom)).toStrictEqual(new Map());
  });

  test("does nothing when cancelled", async () => {
    const user = userEvent.setup();
    const store = renderButton();

    const expectedVertex = new Map(store.get(userVertexStylesAtom));
    const expectedEdge = new Map(store.get(userEdgeStylesAtom));

    await user.click(triggerButton());
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(store.get(userVertexStylesAtom)).toStrictEqual(expectedVertex);
    expect(store.get(userEdgeStylesAtom)).toStrictEqual(expectedEdge);
  });
});
