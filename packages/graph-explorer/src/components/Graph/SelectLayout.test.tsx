// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { atom, createStore, Provider } from "jotai";
import { describe, expect, test } from "vitest";

import type { LayoutName } from "@/core/graphLayout";

import { SelectLayout } from "./SelectLayout";

describe("SelectLayout", () => {
  test("writes the chosen layout to the atom", async () => {
    const user = userEvent.setup();
    const layoutAtom = atom<LayoutName>("F_COSE");
    const store = createStore();
    render(
      <Provider store={store}>
        <SelectLayout layoutAtom={layoutAtom} />
      </Provider>,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(
      screen.getByRole("option", { name: "Hierarchical (Left to Right)" }),
    );

    expect(store.get(layoutAtom)).toBe("DAGRE_LR");
    expect(screen.getByRole("combobox")).toHaveTextContent(
      "Hierarchical (Left to Right)",
    );
  });
});
