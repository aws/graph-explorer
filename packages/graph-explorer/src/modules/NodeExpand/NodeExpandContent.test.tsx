// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MotionGlobalConfig } from "motion/react";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test";

import { TooltipProvider } from "@/components";
import { getAppStore, useDisplayVertex, type VertexId } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import {
  createTestableEdge,
  createTestableVertex,
  DbState,
  FakeExplorer,
  TestProvider,
} from "@/utils/testing";

import NodeExpandContent from "./NodeExpandContent";

const LIMIT_ERROR = "Enter a whole number of 1 or more.";

// happy-dom rejects the limit field's exit animation when motion cancels it.
beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

function NodeExpandContentFor({ vertexId }: { vertexId: VertexId }) {
  const vertex = useDisplayVertex(vertexId);
  return <NodeExpandContent vertex={vertex} />;
}

async function renderExpandSidebar() {
  const explorer = new FakeExplorer();
  const vertex = createTestableVertex();
  const neighbor = createTestableVertex();
  explorer.addTestableEdge(
    createTestableEdge().withSource(vertex).withTarget(neighbor),
  );

  const dbState = new DbState(explorer);
  dbState.addTestableVertexToGraph(vertex);
  if (dbState.activeConnection.connection) {
    dbState.activeConnection.connection.nodeExpansionLimit = 10;
  }
  const fetchNeighbors = vi.spyOn(explorer, "fetchNeighbors");

  const store = getAppStore();
  dbState.applyTo(store);

  render(<NodeExpandContentFor vertexId={vertex.id} />, {
    wrapper: ({ children }) => (
      <TestProvider client={createQueryClient()} store={store}>
        <TooltipProvider>{children}</TooltipProvider>
      </TestProvider>
    ),
  });

  await screen.findByRole("button", { name: "Expand" });

  return { user: userEvent.setup(), vertex, fetchNeighbors };
}

function limitInput() {
  return screen.getByRole("spinbutton", { name: "limit" });
}

function expandButton() {
  return screen.getByRole("button", { name: "Expand" });
}

describe("NodeExpandContent limit", () => {
  test("shows no error before Expand is clicked, even when the limit is empty", async () => {
    const { user } = await renderExpandSidebar();

    await user.clear(limitInput());

    expect(limitInput()).toHaveValue(null);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(limitInput()).toHaveAttribute("aria-invalid", "false");
    expect(expandButton()).toBeEnabled();
  });

  test.each(["", "0", "-3", "1.5"])(
    "blocks the expand request and shows an error when the limit is %j",
    async value => {
      const { user, fetchNeighbors } = await renderExpandSidebar();

      fireEvent.change(limitInput(), { target: { value } });
      await user.click(expandButton());

      expect(await screen.findByRole("alert")).toHaveTextContent(LIMIT_ERROR);
      expect(limitInput()).toHaveFocus();
      expect(limitInput()).toHaveAttribute("aria-invalid", "true");
      expect(limitInput()).toHaveAccessibleDescription(LIMIT_ERROR);
      expect(expandButton()).toBeEnabled();
      expect(fetchNeighbors).not.toHaveBeenCalled();
    },
  );

  test("clears the error as the limit becomes valid and expands with that limit", async () => {
    const { user, vertex, fetchNeighbors } = await renderExpandSidebar();

    await user.clear(limitInput());
    await user.click(expandButton());
    await screen.findByRole("alert");

    await user.type(limitInput(), "5");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(limitInput()).toHaveAttribute("aria-invalid", "false");

    await user.click(expandButton());

    await waitFor(() => expect(fetchNeighbors).toHaveBeenCalledTimes(1));
    expect(fetchNeighbors).toHaveBeenCalledWith(
      expect.objectContaining({ vertexId: vertex.id, limit: 5 }),
    );
  });

  test("expands without a limit and shows no error when the limit is turned off", async () => {
    const { user, fetchNeighbors } = await renderExpandSidebar();

    await user.clear(limitInput());
    await user.click(
      screen.getByRole("switch", { name: /limit returned neighbors/i }),
    );
    await user.click(expandButton());

    await waitFor(() => expect(fetchNeighbors).toHaveBeenCalledTimes(1));
    expect(fetchNeighbors.mock.lastCall?.[0].limit).toBeUndefined();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
