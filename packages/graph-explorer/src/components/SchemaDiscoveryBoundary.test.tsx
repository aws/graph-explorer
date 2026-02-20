import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { SchemaDiscoveryBoundary } from "./SchemaDiscoveryBoundary";

vi.mock("@/core", async () => {
  const actual = await vi.importActual("@/core");
  return {
    ...actual,
    useHasActiveSchema: vi.fn(),
    useMaybeActiveSchema: vi.fn(),
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

import { useHasActiveSchema, useMaybeActiveSchema } from "@/core";
import { useSchemaSync } from "@/hooks/useSchemaSync";
import { createRandomEdgeConnection } from "@/utils/testing/randomData";

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
  edgeConnections,
}: {
  hasSchema?: boolean;
  edgeConnections?: ReturnType<typeof createRandomEdgeConnection>[];
} = {}) {
  mockedUseHasActiveSchema.mockReturnValue(hasSchema);
  mockedUseMaybeActiveSchema.mockReturnValue(
    hasSchema ? { vertices: [], edges: [], edgeConnections } : undefined,
  );
}

describe("SchemaDiscoveryBoundary", () => {
  describe("schema only (default)", () => {
    test("renders children when schema is available", () => {
      mockSchema({ hasSchema: true });
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      render(
        <SchemaDiscoveryBoundary>
          <div>Schema content</div>
        </SchemaDiscoveryBoundary>,
      );

      expect(screen.getByText("Schema content")).toBeInTheDocument();
    });

    test("renders loading state when schema is syncing", () => {
      mockSchema();
      mockedUseSchemaSync.mockReturnValue(
        createMockSchemaSync({ isFetching: true }),
      );

      render(
        <SchemaDiscoveryBoundary>
          <div>Schema content</div>
        </SchemaDiscoveryBoundary>,
      );

      expect(screen.getByText("Synchronizing...")).toBeInTheDocument();
      expect(screen.queryByText("Schema content")).not.toBeInTheDocument();
    });

    test("renders children when isFetching with existing schema", () => {
      mockSchema({ hasSchema: true });
      mockedUseSchemaSync.mockReturnValue(
        createMockSchemaSync({ isFetching: true }),
      );

      render(
        <SchemaDiscoveryBoundary>
          <div>Schema content</div>
        </SchemaDiscoveryBoundary>,
      );

      expect(screen.getByText("Schema content")).toBeInTheDocument();
      expect(screen.queryByText("Synchronizing...")).not.toBeInTheDocument();
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

      render(
        <SchemaDiscoveryBoundary>
          <div>Schema content</div>
        </SchemaDiscoveryBoundary>,
      );

      expect(screen.queryByText("Schema content")).not.toBeInTheDocument();
    });

    test("renders no-schema state when no schema exists", () => {
      mockSchema();
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      render(
        <SchemaDiscoveryBoundary>
          <div>Schema content</div>
        </SchemaDiscoveryBoundary>,
      );

      expect(screen.getByText("No Schema Available")).toBeInTheDocument();
      expect(screen.queryByText("Schema content")).not.toBeInTheDocument();
    });
  });

  describe("requireEdgeConnections", () => {
    test("renders children when edgeConnections is defined", () => {
      mockSchema({
        hasSchema: true,
        edgeConnections: [createRandomEdgeConnection()],
      });
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      render(
        <SchemaDiscoveryBoundary requireEdgeConnections>
          <div>Children</div>
        </SchemaDiscoveryBoundary>,
      );

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

      render(
        <SchemaDiscoveryBoundary requireEdgeConnections>
          <div>Children</div>
        </SchemaDiscoveryBoundary>,
      );

      expect(screen.getByText("Children")).toBeInTheDocument();
    });

    test("renders loading when edgeConnections is undefined and queries are fetching", () => {
      mockSchema({ hasSchema: true, edgeConnections: undefined });
      mockedUseSchemaSync.mockReturnValue(
        createMockSchemaSync({ isFetching: true }),
      );

      render(
        <SchemaDiscoveryBoundary requireEdgeConnections>
          <div>Children</div>
        </SchemaDiscoveryBoundary>,
      );

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

      render(
        <SchemaDiscoveryBoundary requireEdgeConnections>
          <div>Children</div>
        </SchemaDiscoveryBoundary>,
      );

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

      render(
        <SchemaDiscoveryBoundary requireEdgeConnections>
          <div>Children</div>
        </SchemaDiscoveryBoundary>,
      );

      expect(screen.queryByText("Children")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /retry/i }),
      ).toBeInTheDocument();
    });

    test("renders edge connections empty state when schema exists but no edge connections", () => {
      mockSchema({ hasSchema: true, edgeConnections: undefined });
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      render(
        <SchemaDiscoveryBoundary requireEdgeConnections>
          <div>Children</div>
        </SchemaDiscoveryBoundary>,
      );

      expect(
        screen.getByText("No edge-connections Available"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Children")).not.toBeInTheDocument();
    });

    test("renders no-schema state when no schema exists", () => {
      mockSchema();
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      render(
        <SchemaDiscoveryBoundary requireEdgeConnections>
          <div>Children</div>
        </SchemaDiscoveryBoundary>,
      );

      expect(screen.getByText("No Schema Available")).toBeInTheDocument();
      expect(screen.queryByText("Children")).not.toBeInTheDocument();
    });
  });
});
