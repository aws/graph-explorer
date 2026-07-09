// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { TooltipProvider } from "@/components";
import {
  getAppStore,
  sharedEdgeStylesAtom,
  sharedVertexStylesAtom,
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { DbState, TestProvider } from "@/utils/testing";

import ResetAllStylesButton from "./ResetAllStylesButton";

function renderButton(state = new DbState()) {
  const store = getAppStore();
  state.applyTo(store);
  const queryClient = createQueryClient();
  render(
    <TestProvider client={queryClient} store={store}>
      <TooltipProvider>
        <ResetAllStylesButton />
      </TooltipProvider>
    </TestProvider>,
  );
  return store;
}

function triggerButton() {
  return screen.getByRole("button", { name: "Reset All Styles" });
}

describe("ResetAllStylesButton", () => {
  test("renders a trigger button", () => {
    renderButton();
    expect(triggerButton()).toBeInTheDocument();
  });

  test("opens a confirmation dialog when clicked", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(triggerButton());

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(
      screen.getByText(/clear all your styles and all shared styles/),
    ).toBeInTheDocument();
  });

  test("resets all user and shared styles when confirmed", async () => {
    const user = userEvent.setup();
    const store = renderButton();

    await user.click(triggerButton());
    await user.click(screen.getByRole("button", { name: "Reset All Styles" }));

    expect(store.get(userVertexStylesAtom)).toStrictEqual(new Map());
    expect(store.get(userEdgeStylesAtom)).toStrictEqual(new Map());
    expect(store.get(sharedVertexStylesAtom)).toStrictEqual(new Map());
    expect(store.get(sharedEdgeStylesAtom)).toStrictEqual(new Map());
  });

  test("does nothing when cancelled", async () => {
    const user = userEvent.setup();
    const store = renderButton();

    const expectedUserVertex = new Map(store.get(userVertexStylesAtom));
    const expectedUserEdge = new Map(store.get(userEdgeStylesAtom));
    const expectedSharedVertex = new Map(store.get(sharedVertexStylesAtom));
    const expectedSharedEdge = new Map(store.get(sharedEdgeStylesAtom));

    await user.click(triggerButton());
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(store.get(userVertexStylesAtom)).toStrictEqual(expectedUserVertex);
    expect(store.get(userEdgeStylesAtom)).toStrictEqual(expectedUserEdge);
    expect(store.get(sharedVertexStylesAtom)).toStrictEqual(
      expectedSharedVertex,
    );
    expect(store.get(sharedEdgeStylesAtom)).toStrictEqual(expectedSharedEdge);
  });
});
