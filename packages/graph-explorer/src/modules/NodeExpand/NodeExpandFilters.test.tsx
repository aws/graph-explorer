// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { DbState, TestProvider } from "@/utils/testing";

import NodeExpandFilters from "./NodeExpandFilters";

function Harness({
  onLimitChange,
}: {
  onLimitChange: (limit: number | null) => void;
}) {
  const [limit, setLimit] = useState<number | null>(100);
  return (
    <NodeExpandFilters
      neighborsOptions={[{ label: "Person", value: "Person" }]}
      selectedType="Person"
      onSelectedTypeChange={() => {}}
      filters={[]}
      onFiltersChange={() => {}}
      limit={limit}
      onLimitChange={value => {
        setLimit(value);
        onLimitChange(value);
      }}
      limitEnabled={true}
      onLimitEnabledToggle={() => {}}
    />
  );
}

function renderFilters(onLimitChange: (limit: number | null) => void) {
  const state = new DbState();
  const store = getAppStore();
  state.applyTo(store);
  render(
    <TestProvider client={createQueryClient()} store={store}>
      <TooltipProvider>
        <Harness onLimitChange={onLimitChange} />
      </TooltipProvider>
    </TestProvider>,
  );
  return screen.getByLabelText("limit");
}

describe("NodeExpandFilters", () => {
  it("reports null when the limit input is cleared", async () => {
    const user = userEvent.setup();
    const onLimitChange = vi.fn();
    const input = renderFilters(onLimitChange);

    await user.clear(input);

    expect(onLimitChange).toHaveBeenLastCalledWith(null);
    expect(input).toHaveValue(null);
  });

  it("reports the parsed number when the limit changes", async () => {
    const user = userEvent.setup();
    const onLimitChange = vi.fn();
    const input = renderFilters(onLimitChange);

    await user.clear(input);
    await user.type(input, "50");

    expect(onLimitChange).toHaveBeenLastCalledWith(50);
    expect(input).toHaveValue(50);
  });
});
