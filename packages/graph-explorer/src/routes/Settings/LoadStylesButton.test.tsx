// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { describe, expect, test, vi } from "vitest";

import type { VertexPreferencesStorageModel } from "@/core/StateProvider/userPreferences";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import { createVertexType, type VertexType } from "@/core/entities";
import { createFileEnvelope } from "@/core/fileEnvelope";
import { createQueryClient } from "@/core/queryClient";
import { sharedVertexStylesAtom } from "@/core/StateProvider/storageAtoms";
import { TestProvider } from "@/utils/testing";

import LoadStylesButton from "./LoadStylesButton";

vi.mock("@/utils/fileData", () => ({
  toJsonFileData: vi.fn(),
  fromFileToJson: vi.fn(),
  saveFile: vi.fn(),
}));

function renderButton() {
  const store = getAppStore();
  const queryClient = createQueryClient();
  render(
    <TestProvider client={queryClient} store={store}>
      <TooltipProvider>
        <LoadStylesButton />
      </TooltipProvider>
    </TestProvider>,
  );
  return store;
}

/** Builds a styling-export file with the given payload data. */
function stylingFile(data: unknown) {
  const envelope = createFileEnvelope("styling-export", 1, data);
  return new File([JSON.stringify(envelope)], "graph-explorer.styles.json", {
    type: "application/json",
  });
}

/** The hidden file input the FileButton renders. */
function fileInput() {
  // eslint-disable-next-line testing-library/no-node-access
  return document.querySelector<HTMLInputElement>('input[type="file"]')!;
}

describe("LoadStylesButton", () => {
  test("applies immediately and reports counts when there are no conflicts", async () => {
    const user = userEvent.setup();
    const store = renderButton();

    await user.upload(
      fileInput(),
      stylingFile({
        vertices: { Person: { color: "#abc" }, Airport: { color: "#def" } },
        edges: {},
      }),
    );

    expect(await screen.findByText("Styles Loaded")).toBeInTheDocument();
    // Node-only load omits the zero edge side.
    expect(screen.getByText("Loaded 2 node styles.")).toBeInTheDocument();
    expect(
      store.get(sharedVertexStylesAtom).get(createVertexType("Person")),
    ).toStrictEqual({ type: createVertexType("Person"), color: "#abc" });
  });

  test("joins both sides of the count message when a file loads vertices and edges", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.upload(
      fileInput(),
      stylingFile({
        vertices: { Person: { color: "#abc" } },
        edges: { knows: { lineColor: "#def" } },
      }),
    );

    expect(await screen.findByText("Styles Loaded")).toBeInTheDocument();
    expect(
      screen.getByText("Loaded 1 node style and 1 edge style."),
    ).toBeInTheDocument();
  });

  test("prompts before overwriting an existing shared style, then completes on confirm", async () => {
    const user = userEvent.setup();
    const store = renderButton();
    store.set(
      sharedVertexStylesAtom,
      new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("Person"),
          { type: createVertexType("Person"), color: "#old" },
        ],
      ]),
    );

    await user.upload(
      fileInput(),
      stylingFile({ vertices: { Person: { color: "#new" } }, edges: {} }),
    );

    // Conflict prompt first — nothing applied yet.
    expect(
      await screen.findByText("Replace 1 existing shared style?"),
    ).toBeInTheDocument();
    expect(
      store.get(sharedVertexStylesAtom).get(createVertexType("Person"))?.color,
    ).toBe("#old");

    await user.click(screen.getByRole("button", { name: "Load & Replace" }));

    expect(await screen.findByText("Styles Loaded")).toBeInTheDocument();
    expect(
      store.get(sharedVertexStylesAtom).get(createVertexType("Person"))?.color,
    ).toBe("#new");
  });

  test("rejects the whole file and lists issues when a value is invalid", async () => {
    const user = userEvent.setup();
    const store = renderButton();

    await user.upload(
      fileInput(),
      stylingFile({ vertices: { Person: { shape: "blob" } }, edges: {} }),
    );

    expect(await screen.findByText("Load Failed")).toBeInTheDocument();
    expect(screen.getByText("Person")).toBeInTheDocument();
    // Nothing persisted.
    expect(store.get(sharedVertexStylesAtom).size).toBe(0);
  });

  test("reports when a valid file contains no recognized styles", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.upload(
      fileInput(),
      stylingFile({ vertices: { Ghost: { bogus: "x" } }, edges: {} }),
    );

    expect(await screen.findByText("No Styles Found")).toBeInTheDocument();
  });

  test("surfaces an envelope-level error for the wrong file kind", async () => {
    const user = userEvent.setup();
    renderButton();

    // A file that clears the .styles.json filter (renamed, or force-picked via
    // "All Files") but carries the wrong envelope kind — content validation,
    // not the filename, must reject it.
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
    expect(
      screen.getByText(/Expected a "styling-export" file/),
    ).toBeInTheDocument();
  });

  test("closes the dialog when the result is dismissed", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.upload(
      fileInput(),
      stylingFile({ vertices: { Person: { color: "#abc" } }, edges: {} }),
    );

    expect(await screen.findByText("Styles Loaded")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByText("Styles Loaded")).not.toBeInTheDocument();
  });

  test("never reveals an ancestor Suspense fallback while loading", async () => {
    const user = userEvent.setup();
    const store = getAppStore();
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
      stylingFile({ vertices: { Person: { color: "#abc" } }, edges: {} }),
    );
    await screen.findByText("Styles Loaded");
    observer.disconnect();

    expect(fallbackSeen).toBe(false);
  });
});
