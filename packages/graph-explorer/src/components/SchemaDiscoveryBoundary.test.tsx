// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vitest";

import { SchemaDiscoveryBoundary } from "./SchemaDiscoveryBoundary";

vi.mock("@/core", async () => {
  const actual = await vi.importActual("@/core");
  return {
    ...actual,
    useHasActiveSchema: vi.fn(),
    useMaybeActiveSchema: vi.fn(),
    useConfiguration: vi.fn(),
  };
});

vi.mock("@/hooks/useSchemaSync", () => ({
  useSchemaSync: vi.fn(),
  useCancelSchemaSync: vi.fn(() => vi.fn()),
}));

vi.mock("@/hooks", async () => {
  const actual = await vi.importActual("@/hooks");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

import {
  useConfiguration,
  useHasActiveSchema,
  useMaybeActiveSchema,
} from "@/core";
import { useSchemaSync } from "@/hooks/useSchemaSync";
import { createRandomEdgeConnection } from "@/utils/testing/randomData";

const mockedUseConfiguration = vi.mocked(useConfiguration);
const mockedUseHasActiveSchema = vi.mocked(useHasActiveSchema);
const mockedUseMaybeActiveSchema = vi.mocked(useMaybeActiveSchema);
const mockedUseSchemaSync = vi.mocked(useSchemaSync);

function createMockSchemaSync(
  overrides: Partial<ReturnType<typeof useSchemaSync>> = {},
): ReturnType<typeof useSchemaSync> {
  return {
    schemaDiscoveryQuery: {
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSchemaSync>["schemaDiscoveryQuery"],
    edgeDiscoveryQuery: {
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSchemaSync>["edgeDiscoveryQuery"],
    refreshSchema: vi.fn(),
    isFetching: false,
    ...overrides,
  };
}

function mockSchema({
  hasSchema = false,
  hasConnection = true,
  edgeConnections,
}: {
  hasSchema?: boolean;
  hasConnection?: boolean;
  edgeConnections?: ReturnType<typeof createRandomEdgeConnection>[];
} = {}) {
  mockedUseConfiguration.mockReturnValue(
    hasConnection ? ({} as ReturnType<typeof useConfiguration>) : undefined,
  );
  mockedUseHasActiveSchema.mockReturnValue(hasSchema);
  mockedUseMaybeActiveSchema.mockReturnValue(
    hasSchema ? { vertices: [], edges: [], edgeConnections } : undefined,
  );
}

describe("SchemaDiscoveryBoundary", () => {
  function renderBoundary(props: { requireEdgeConnections?: boolean } = {}) {
    return render(
      <MemoryRouter>
        <SchemaDiscoveryBoundary {...props}>
          <div>Children</div>
        </SchemaDiscoveryBoundary>
      </MemoryRouter>,
    );
  }

  describe("no active connection", () => {
    test("renders no-connection state when no connection is configured", () => {
      mockSchema({ hasConnection: false });
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      renderBoundary();

      expect(screen.getByText("No Connection")).toBeInTheDocument();
      expect(screen.queryByText("No Schema Available")).not.toBeInTheDocument();
      expect(screen.queryByText("Children")).not.toBeInTheDocument();
    });

    test("renders no-connection state even with requireEdgeConnections", () => {
      mockSchema({ hasConnection: false });
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      renderBoundary({ requireEdgeConnections: true });

      expect(screen.getByText("No Connection")).toBeInTheDocument();
      expect(screen.queryByText("Children")).not.toBeInTheDocument();
    });
  });

  describe("schema only (default)", () => {
    test("renders children when schema is available", () => {
      mockSchema({ hasSchema: true });
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      renderBoundary();

      expect(screen.getByText("Children")).toBeInTheDocument();
    });

    test("renders loading state when schema is syncing", () => {
      mockSchema();
      mockedUseSchemaSync.mockReturnValue(
        createMockSchemaSync({ isFetching: true }),
      );

      renderBoundary();

      expect(screen.getByText("Synchronizing...")).toBeInTheDocument();
      expect(screen.queryByText("Children")).not.toBeInTheDocument();
    });

    test("renders loading state when isFetching with existing schema", () => {
      mockSchema({ hasSchema: true });
      mockedUseSchemaSync.mockReturnValue(
        createMockSchemaSync({ isFetching: true }),
      );

      renderBoundary();

      expect(screen.getByText("Synchronizing...")).toBeInTheDocument();
      expect(screen.queryByText("Children")).not.toBeInTheDocument();
    });

    test("renders error state when schema sync fails", () => {
      mockSchema();
      mockedUseSchemaSync.mockReturnValue(
        createMockSchemaSync({
          schemaDiscoveryQuery: {
            isFetching: false,
            error: new Error("Sync failed"),
            refetch: vi.fn(),
          } as unknown as ReturnType<
            typeof useSchemaSync
          >["schemaDiscoveryQuery"],
        }),
      );

      renderBoundary();

      expect(screen.queryByText("Children")).not.toBeInTheDocument();
    });

    test("renders no-schema state when no schema exists", () => {
      mockSchema();
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      renderBoundary();

      expect(screen.getByText("No Schema Available")).toBeInTheDocument();
      expect(screen.queryByText("Children")).not.toBeInTheDocument();
    });
  });

  describe("requireEdgeConnections", () => {
    test("renders children when edgeConnections is defined", () => {
      mockSchema({
        hasSchema: true,
        edgeConnections: [createRandomEdgeConnection()],
      });
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      renderBoundary({ requireEdgeConnections: true });

      expect(screen.getByText("Children")).toBeInTheDocument();
    });

    test("renders children when edgeConnections exists even if edge query has error", () => {
      mockSchema({
        hasSchema: true,
        edgeConnections: [createRandomEdgeConnection()],
      });
      mockedUseSchemaSync.mockReturnValue(
        createMockSchemaSync({
          edgeDiscoveryQuery: {
            isFetching: false,
            error: new Error("Query failed"),
            refetch: vi.fn(),
          } as unknown as ReturnType<
            typeof useSchemaSync
          >["edgeDiscoveryQuery"],
        }),
      );

      renderBoundary({ requireEdgeConnections: true });

      expect(screen.getByText("Children")).toBeInTheDocument();
    });

    test("renders loading when edgeConnections is undefined and queries are fetching", () => {
      mockSchema({ hasSchema: true, edgeConnections: undefined });
      mockedUseSchemaSync.mockReturnValue(
        createMockSchemaSync({ isFetching: true }),
      );

      renderBoundary({ requireEdgeConnections: true });

      expect(screen.getByText("Synchronizing...")).toBeInTheDocument();
      expect(screen.queryByText("Children")).not.toBeInTheDocument();
    });

    test("renders error when schema query has error", () => {
      mockSchema({ hasSchema: false });
      mockedUseSchemaSync.mockReturnValue(
        createMockSchemaSync({
          schemaDiscoveryQuery: {
            isFetching: false,
            error: new Error("Schema query failed"),
            refetch: vi.fn(),
          } as unknown as ReturnType<
            typeof useSchemaSync
          >["schemaDiscoveryQuery"],
        }),
      );

      renderBoundary({ requireEdgeConnections: true });

      expect(screen.queryByText("Children")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /retry/i }),
      ).toBeInTheDocument();
    });

    test("renders error when edge query has error and no edge connections", () => {
      mockSchema({ hasSchema: true, edgeConnections: undefined });
      mockedUseSchemaSync.mockReturnValue(
        createMockSchemaSync({
          edgeDiscoveryQuery: {
            isFetching: false,
            error: new Error("Query failed"),
            refetch: vi.fn(),
          } as unknown as ReturnType<
            typeof useSchemaSync
          >["edgeDiscoveryQuery"],
        }),
      );

      renderBoundary({ requireEdgeConnections: true });

      expect(screen.queryByText("Children")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /retry/i }),
      ).toBeInTheDocument();
    });

    test("renders edge connections empty state when schema exists but no edge connections", () => {
      mockSchema({ hasSchema: true, edgeConnections: undefined });
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      renderBoundary({ requireEdgeConnections: true });

      expect(
        screen.getByText("No edge-connections Available"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Children")).not.toBeInTheDocument();
    });

    test("renders no-schema state when no schema exists", () => {
      mockSchema();
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      renderBoundary({ requireEdgeConnections: true });

      expect(screen.getByText("No Schema Available")).toBeInTheDocument();
      expect(screen.queryByText("Children")).not.toBeInTheDocument();
    });
  });
});
