// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import { createEdgeType, createVertexType } from "@/core/entities";
import { createFileEnvelope } from "@/core/fileEnvelope";
import { createQueryClient } from "@/core/queryClient";
import {
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";
import { DbState, TestProvider } from "@/utils/testing";

import { LoadStylesButton } from "./LoadStylesButton";

vi.mock("@/utils/fileData", () => ({
  toJsonFileData: vi.fn(),
  fromFileToJson: vi.fn(),
  saveFile: vi.fn(),
}));

function renderButton(seed?: (state: DbState) => void) {
  const state = new DbState();
  // Start with no user styles so seeded ones are the only conflicts.
  state.vertexStyles.clear();
  state.edgeStyles.clear();
  seed?.(state);
  const store = getAppStore();
  state.applyTo(store);
  render(
    <TestProvider client={createQueryClient()} store={store}>
      <TooltipProvider>
        <LoadStylesButton />
      </TooltipProvider>
    </TestProvider>,
  );
  return store;
}

function stylingFile(data: unknown) {
  const envelope = createFileEnvelope("styling-export", 1, data);
  return new File([JSON.stringify(envelope)], "graph-explorer.styles.json", {
    type: "application/json",
  });
}

function fileInput() {
  // eslint-disable-next-line testing-library/no-node-access
  return document.querySelector<HTMLInputElement>('input[type="file"]')!;
}

describe("LoadStylesButton", () => {
  test("opens the selective modal for a valid file and shows a card per type", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.upload(
      fileInput(),
      stylingFile({
        vertices: { Airport: { color: "#abc" }, Country: { color: "#def" } },
        edges: { route: { lineColor: "#123" } },
      }),
    );

    expect(
      await screen.findByText("graph-explorer.styles.json"),
    ).toBeInTheDocument();
    // One selectable card per type. The checkbox's accessible name identifies
    // its card, and is unambiguous where the type name is not (the edge preview
    // repeats the type name inside its rendered label).
    expect(
      screen.getByRole("checkbox", { name: "Load Airport style" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Load Country style" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Load route style" }),
    ).toBeInTheDocument();
  });

  test("loads only the selected styles to user storage", async () => {
    const user = userEvent.setup();
    const store = renderButton();

    await user.upload(
      fileInput(),
      stylingFile({
        vertices: { Airport: { color: "#abc" }, Country: { color: "#def" } },
        edges: {},
      }),
    );

    // Deselect Country, keep Airport.
    await user.click(
      await screen.findByRole("checkbox", { name: "Load Country style" }),
    );
    await user.click(screen.getByRole("button", { name: "Load 1 selected" }));

    const styles = store.get(userVertexStylesAtom);
    expect(styles.get(createVertexType("Airport"))).toStrictEqual({
      type: createVertexType("Airport"),
      color: "#abc",
    });
    expect(styles.has(createVertexType("Country"))).toBe(false);

    // The modal closes once the load is applied.
    await waitFor(() =>
      expect(
        screen.queryByText("graph-explorer.styles.json"),
      ).not.toBeInTheDocument(),
    );
  });

  test("toggles selection when the card body, not just the checkbox, is clicked", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.upload(
      fileInput(),
      stylingFile({ vertices: { Airport: { color: "#abc" } }, edges: {} }),
    );

    // Click the type name in the card body — the wrapping label forwards to the
    // checkbox, so the whole card is one control.
    await user.click(await screen.findByText("Airport"));

    expect(
      screen.getByRole("checkbox", { name: "Load Airport style" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "Load 0 selected" }),
    ).toBeDisabled();
  });

  test("toggles selection from the keyboard", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.upload(
      fileInput(),
      stylingFile({ vertices: { Airport: { color: "#abc" } }, edges: {} }),
    );

    const checkbox = await screen.findByRole("checkbox", {
      name: "Load Airport style",
    });
    checkbox.focus();
    await user.keyboard(" ");

    expect(checkbox).not.toBeChecked();
  });

  test("rejects the whole file and lists issues when a value is invalid", async () => {
    const user = userEvent.setup();
    const store = renderButton();

    await user.upload(
      fileInput(),
      stylingFile({ vertices: { Airport: { shape: "blob" } }, edges: {} }),
    );

    expect(await screen.findByText("Load Failed")).toBeInTheDocument();
    expect(screen.getByText("Airport")).toBeInTheDocument();
    expect(store.get(userVertexStylesAtom).size).toBe(0);
  });

  test("reports when every style in the file already matches", async () => {
    const user = userEvent.setup();
    renderButton(state => {
      state.addVertexStyle(createVertexType("Airport"), { color: "#abc" });
    });

    await user.upload(
      fileInput(),
      stylingFile({ vertices: { Airport: { color: "#abc" } }, edges: {} }),
    );

    expect(await screen.findByText("No Styles to Load")).toBeInTheDocument();
  });

  test("reports when the file contains no styles at all", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.upload(fileInput(), stylingFile({ vertices: {}, edges: {} }));

    expect(await screen.findByText("No Styles Found")).toBeInTheDocument();
  });

  test("labels a card that replaces an existing style 'Current' and a new one 'Default'", async () => {
    const user = userEvent.setup();
    renderButton(state => {
      // Airport already has a user style, so loading a different one conflicts.
      state.addVertexStyle(createVertexType("Airport"), { color: "#abc" });
    });

    await user.upload(
      fileInput(),
      stylingFile({
        vertices: { Airport: { color: "#def" }, Country: { color: "#111" } },
        edges: {},
      }),
    );

    // The conflicting Airport card tags its before side "Current"; the brand-new
    // Country card tags its before side "Default".
    expect(await screen.findByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  test("renders an edge card with its before and after previews", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.upload(
      fileInput(),
      stylingFile({ vertices: {}, edges: { route: { lineColor: "#123" } } }),
    );

    expect(
      await screen.findByRole("checkbox", { name: "Load route style" }),
    ).toBeInTheDocument();
    // Both edge previews render, each labelled by the resolved edge type.
    expect(screen.getAllByLabelText("route edge preview")).toHaveLength(2);
  });

  test("Select all within a filter and search only toggles the matching items", async () => {
    const user = userEvent.setup();
    const store = renderButton();

    await user.upload(
      fileInput(),
      stylingFile({
        vertices: { Airport: { color: "#abc" } },
        edges: {
          airRoute: { lineColor: "#111" },
          seaRoute: { lineColor: "#222" },
          contains: { lineColor: "#333" },
        },
      }),
    );

    // Everything starts selected; clear it so Select-All's effect is isolated.
    await user.click(
      await screen.findByRole("checkbox", { name: "Select all" }),
    );
    expect(
      screen.getByRole("button", { name: "Load 0 selected" }),
    ).toBeInTheDocument();

    // Filter to edges, then search "route" — leaves airRoute and seaRoute.
    await user.click(screen.getByRole("radio", { name: "Edges 3" }));
    await user.type(
      screen.getByPlaceholderText("Search by type name"),
      "route",
    );

    // Select all now toggles only the two visible, matching edges.
    await user.click(screen.getByRole("checkbox", { name: "Select all" }));
    await user.click(screen.getByRole("button", { name: "Load 2 selected" }));

    const styles = store.get(userEdgeStylesAtom);
    expect(styles.has(createEdgeType("airRoute"))).toBe(true);
    expect(styles.has(createEdgeType("seaRoute"))).toBe(true);
    // The vertex and the non-matching edge stayed unselected.
    expect(styles.has(createEdgeType("contains"))).toBe(false);
    expect(
      store.get(userVertexStylesAtom).has(createVertexType("Airport")),
    ).toBe(false);
  });

  test("shows an empty state when the search matches no type", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.upload(
      fileInput(),
      stylingFile({ vertices: { Airport: { color: "#abc" } }, edges: {} }),
    );

    await user.type(
      await screen.findByPlaceholderText("Search by type name"),
      "zzz",
    );

    expect(screen.getByText("No matching types")).toBeInTheDocument();
    // The card is gone but the modal is still open for editing the search.
    expect(
      screen.queryByRole("checkbox", { name: "Load Airport style" }),
    ).not.toBeInTheDocument();
  });

  test("surfaces an envelope-level error for the wrong file kind", async () => {
    const user = userEvent.setup();
    renderButton();

    const wrongKind = createFileEnvelope("connection-export", 1, {
      vertices: {},
      edges: {},
    });
    await user.upload(
      fileInput(),
      new File([JSON.stringify(wrongKind)], "graph-explorer.styles.json", {
        type: "application/json",
      }),
    );

    expect(await screen.findByText("Invalid file")).toBeInTheDocument();
  });

  test("never reveals an ancestor Suspense fallback while loading", async () => {
    const user = userEvent.setup();
    const store = getAppStore();
    new DbState().applyTo(store);
    render(
      <TestProvider client={createQueryClient()} store={store}>
        <TooltipProvider>
          <Suspense fallback={<div>page loading</div>}>
            <LoadStylesButton />
          </Suspense>
        </TooltipProvider>
      </TestProvider>,
    );

    let fallbackSeen = false;
    const observer = new MutationObserver(() => {
      if (screen.queryByText("page loading")) fallbackSeen = true;
    });
    observer.observe(document.body, { childList: true, subtree: true });

    await user.upload(
      fileInput(),
      stylingFile({ vertices: { Airport: { color: "#abc" } }, edges: {} }),
    );
    await screen.findByText("graph-explorer.styles.json");
    observer.disconnect();

    expect(fallbackSeen).toBe(false);
  });
});
