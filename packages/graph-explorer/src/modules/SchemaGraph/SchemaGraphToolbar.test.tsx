// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import type { SchemaViewLayout } from "@/core/StateProvider/schemaViewLayoutDefaults";

import { TooltipProvider } from "@/components";
import { GraphProvider } from "@/components/Graph";
import { getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { schemaViewLayoutAtom } from "@/core/StateProvider/storageAtoms";
import {
  createRandomSchemaViewLayout,
  DbState,
  TestProvider,
} from "@/utils/testing";

import { SchemaGraphToolbar } from "./SchemaGraphToolbar";

function renderToolbar(layout: SchemaViewLayout) {
  const store = getAppStore();
  new DbState().withSchemaViewLayout(layout).applyTo(store);
  render(
    <TestProvider client={createQueryClient()} store={store}>
      <TooltipProvider>
        <GraphProvider>
          <SchemaGraphToolbar />
        </GraphProvider>
      </TooltipProvider>
    </TestProvider>,
  );
  return store;
}

describe("SchemaGraphToolbar", () => {
  test("shows the persisted layout algorithm", () => {
    renderToolbar({
      ...createRandomSchemaViewLayout(),
      layoutAlgorithm: "DAGRE_LR",
    });

    expect(screen.getByRole("combobox")).toHaveTextContent(
      "Hierarchical (Left to Right)",
    );
  });

  test("persists the chosen layout algorithm", async () => {
    const user = userEvent.setup();
    const layout: SchemaViewLayout = {
      ...createRandomSchemaViewLayout(),
      layoutAlgorithm: "DAGRE_LR",
    };
    const store = renderToolbar(layout);

    await user.click(screen.getByRole("combobox"));
    await user.click(
      screen.getByRole("option", { name: "Klay (Top to Bottom)" }),
    );

    expect(store.get(schemaViewLayoutAtom)).toStrictEqual({
      ...layout,
      layoutAlgorithm: "KLAY_TB",
    });
  });
});
