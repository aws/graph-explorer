// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import type { VertexPreferencesStorageModel } from "@/core/StateProvider/userPreferences";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import { createVertexType, type VertexType } from "@/core/entities";
import { createFileEnvelope } from "@/core/fileEnvelope";
import { createQueryClient } from "@/core/queryClient";
import { importedVertexStylesAtom } from "@/core/StateProvider/storageAtoms";
import { TestProvider } from "@/utils/testing";

import ImportStylesButton from "./ImportStylesButton";

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
        <ImportStylesButton />
      </TooltipProvider>
    </TestProvider>,
  );
  return store;
}

/** Builds a styling-export file with the given payload data. */
function stylingFile(data: unknown) {
  const envelope = createFileEnvelope("styling-export", 1, data);
  return new File([JSON.stringify(envelope)], "styles.json", {
    type: "application/json",
  });
}

/** The hidden file input the FileButton renders. */
function fileInput() {
  // eslint-disable-next-line testing-library/no-node-access
  return document.querySelector<HTMLInputElement>('input[type="file"]')!;
}

describe("ImportStylesButton", () => {
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

    expect(await screen.findByText("Import Complete")).toBeInTheDocument();
    expect(
      screen.getByText("Imported 2 vertex types and 0 edge types."),
    ).toBeInTheDocument();
    expect(
      store.get(importedVertexStylesAtom).get(createVertexType("Person")),
    ).toStrictEqual({ type: createVertexType("Person"), color: "#abc" });
  });

  test("prompts before overwriting an existing imported default, then completes on confirm", async () => {
    const user = userEvent.setup();
    const store = renderButton();
    store.set(
      importedVertexStylesAtom,
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
      await screen.findByText("Replace 1 existing default?"),
    ).toBeInTheDocument();
    expect(
      store.get(importedVertexStylesAtom).get(createVertexType("Person"))
        ?.color,
    ).toBe("#old");

    await user.click(screen.getByRole("button", { name: "Import & Replace" }));

    expect(await screen.findByText("Import Complete")).toBeInTheDocument();
    expect(
      store.get(importedVertexStylesAtom).get(createVertexType("Person"))
        ?.color,
    ).toBe("#new");
  });

  test("rejects the whole file and lists issues when a value is invalid", async () => {
    const user = userEvent.setup();
    const store = renderButton();

    await user.upload(
      fileInput(),
      stylingFile({ vertices: { Person: { shape: "blob" } }, edges: {} }),
    );

    expect(await screen.findByText("Import Failed")).toBeInTheDocument();
    expect(screen.getByText("Person")).toBeInTheDocument();
    // Nothing persisted.
    expect(store.get(importedVertexStylesAtom).size).toBe(0);
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

    const wrongKind = createFileEnvelope("connection-export", 1, {
      vertices: {},
      edges: {},
    });
    await user.upload(
      fileInput(),
      new File([JSON.stringify(wrongKind)], "conn.json", {
        type: "application/json",
      }),
    );

    expect(await screen.findByText("Import Failed")).toBeInTheDocument();
    expect(
      screen.getByText(/Expected a "styling-export" file/),
    ).toBeInTheDocument();
  });
});
