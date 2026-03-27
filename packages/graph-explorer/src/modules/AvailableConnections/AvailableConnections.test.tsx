import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { configurationAtom, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { TestProvider } from "@/utils/testing";

import AvailableConnections from "./AvailableConnections";

vi.mock("@/modules/CreateConnection", () => ({
  default: () => <div>CreateConnection</div>,
}));

describe("AvailableConnections", () => {
  test("renders empty state when there are no connections", () => {
    const store = getAppStore();
    store.set(configurationAtom, new Map());
    const queryClient = createQueryClient();

    render(
      <TestProvider client={queryClient} store={store}>
        <TooltipProvider>
          <AvailableConnections isSync={false} />
        </TooltipProvider>
      </TestProvider>,
    );

    expect(screen.getByText("No Connections")).toBeInTheDocument();
  });
});
