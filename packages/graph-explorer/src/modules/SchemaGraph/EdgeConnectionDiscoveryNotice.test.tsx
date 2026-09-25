// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { EdgeConnectionDiscoveryError } from "@/connector/gremlin/fetchEdgeConnections/discoveryError";
import { createEdgeType, getAppStore, schemaAtom } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { NetworkError } from "@/utils";
import {
  DbState,
  FakeExplorer,
  flushPendingAtomUpdates,
  TestProvider,
} from "@/utils/testing";

import { EdgeConnectionDiscoveryNotice } from "./EdgeConnectionDiscoveryNotice";

/**
 * Renders against the real store and query client, like
 * SchemaDiscoveryBoundary.integration.test.tsx, so it observes the notice
 * react to the flag/error the edge discovery query actually writes.
 */
describe("EdgeConnectionDiscoveryNotice", () => {
  let explorer: FakeExplorer;

  beforeEach(() => {
    explorer = new FakeExplorer();
  });

  function renderNotice(state: DbState) {
    const store = getAppStore();
    state.applyTo(store);

    const queryClient = createQueryClient();
    const defaultOptions = queryClient.getDefaultOptions();
    queryClient.setDefaultOptions({
      ...defaultOptions,
      queries: { ...defaultOptions.queries, retry: false },
    });

    return render(
      <TestProvider client={queryClient} store={store}>
        <MemoryRouter>
          <EdgeConnectionDiscoveryNotice />
        </MemoryRouter>
      </TestProvider>,
    );
  }

  // Pinned so the translated "edge-connections" label ("Relationships") is
  // deterministic; DbState otherwise picks a random query engine.
  function stateWithEdgeType() {
    const state = new DbState(explorer);
    if (state.activeConfig.connection) {
      state.activeConfig.connection.queryEngine = "gremlin";
    }
    state.activeSchema.edges = [
      { type: createEdgeType("knows"), attributes: [] },
    ];
    state.activeSchema.edgeConnections = undefined;
    state.activeSchema.lastEdgeConnectionSyncFail = false;
    return state;
  }

  test("shows the error title, recovery text, Error Details, and Retry when discovery rejects", async () => {
    const cause = new Error("Query timed out");
    const error = new EdgeConnectionDiscoveryError(
      {
        strategy: "sampled",
        setting: "auto",
        requests: 3,
        totalEdges: 100,
        degraded: false,
      },
      cause,
    );
    vi.spyOn(explorer, "fetchEdgeConnections").mockRejectedValue(error);

    renderNotice(stateWithEdgeType());

    await waitFor(() => {
      expect(
        screen.getByText("Could not discover edge connections"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(new RegExp(error.recovery))).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /error details/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  test("hides the notice and clears the stored failure flag once retry resolves", async () => {
    const error = new EdgeConnectionDiscoveryError(
      {
        strategy: "sampled",
        setting: "auto",
        requests: 1,
        totalEdges: 10,
        degraded: false,
      },
      new Error("boom"),
    );
    const spy = vi
      .spyOn(explorer, "fetchEdgeConnections")
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ edgeConnections: [] });

    const state = stateWithEdgeType();
    renderNotice(state);

    await waitFor(() => {
      expect(
        screen.getByText("Could not discover edge connections"),
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(
        screen.queryByText("Could not discover edge connections"),
      ).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledTimes(2);

    const store = getAppStore();
    const persisted = store.get(schemaAtom).get(state.activeConfig.id);
    expect(persisted?.lastEdgeConnectionSyncFail).toBe(false);
  });

  test("shows the reload copy without Error Details and does not fetch on mount when the failure flag is persisted with no connections", async () => {
    const fetchSpy = vi.spyOn(explorer, "fetchEdgeConnections");

    const state = stateWithEdgeType();
    state.activeSchema.lastEdgeConnectionSyncFail = true;

    renderNotice(state);
    await flushPendingAtomUpdates();

    expect(
      screen.getByText("Could not discover Relationships"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The last attempt failed. Retry to try again and see why.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /error details/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("renders nothing when edge connections is an empty array", async () => {
    const state = new DbState(explorer);
    state.activeSchema.edges = [];
    state.activeSchema.edgeConnections = [];
    state.activeSchema.lastEdgeConnectionSyncFail = false;

    renderNotice(state);
    await flushPendingAtomUpdates();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("shows the connection-refused display inline when discovery rejects with that error code", async () => {
    const error = new NetworkError("Failed to fetch", 500, {
      code: "ECONNREFUSED",
    });
    vi.spyOn(explorer, "fetchEdgeConnections").mockRejectedValue(error);

    renderNotice(stateWithEdgeType());

    await waitFor(() => {
      expect(screen.getByText("Connection refused")).toBeInTheDocument();
    });
  });

  test("shows the not-discovered notice with a Synchronize action before discovery has ever completed", async () => {
    // Hangs the fetch so the component renders the moment edgeConnections is
    // still undefined with no error or failure flag, rather than racing the
    // FakeExplorer's near-instant resolution.
    vi.spyOn(explorer, "fetchEdgeConnections").mockImplementation(
      () => new Promise(() => {}),
    );

    renderNotice(stateWithEdgeType());
    await flushPendingAtomUpdates();

    expect(
      screen.getByText("Relationships not discovered"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /synchronize/i }),
    ).toBeInTheDocument();
  });
});
