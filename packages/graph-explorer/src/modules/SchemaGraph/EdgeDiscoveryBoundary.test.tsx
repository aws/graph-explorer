import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { EdgeDiscoveryBoundary } from "./EdgeDiscoveryBoundary";

vi.mock("@/core", async () => {
  const actual = await vi.importActual("@/core");
  return {
    ...actual,
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

import { useMaybeActiveSchema } from "@/core";
import { useSchemaSync } from "@/hooks/useSchemaSync";
import { createRandomEdgeConnection } from "@/utils/testing/randomData";

const mockedUseMaybeActiveSchema = vi.mocked(useMaybeActiveSchema);
const mockedUseSchemaSync = vi.mocked(useSchemaSync);

function createMockSchemaSync(
  overrides: Partial<ReturnType<typeof useSchemaSync>> = {},
): ReturnType<typeof useSchemaSync> {
  return {
    schemaDiscoveryQuery: {
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSchemaSync>["schemaDiscoveryQuery"],
    edgeDiscoveryQuery: {
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSchemaSync>["edgeDiscoveryQuery"],
    refreshSchema: vi.fn(),
    isFetching: false,
    ...overrides,
  };
}

describe("EdgeDiscoveryBoundary", () => {
  test("renders children when edgeConnections is defined", () => {
    mockedUseMaybeActiveSchema.mockReturnValue({
      vertices: [],
      edges: [],
      edgeConnections: [createRandomEdgeConnection()],
    });
    mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

    render(
      <EdgeDiscoveryBoundary>
        <div>Children</div>
      </EdgeDiscoveryBoundary>,
    );

    expect(screen.getByText("Children")).toBeInTheDocument();
  });

  test("renders children when edgeConnections exists even if edge query has error", () => {
    mockedUseMaybeActiveSchema.mockReturnValue({
      vertices: [],
      edges: [],
      edgeConnections: [createRandomEdgeConnection()],
    });
    mockedUseSchemaSync.mockReturnValue(
      createMockSchemaSync({
        edgeDiscoveryQuery: {
          isLoading: false,
          error: new Error("Query failed"),
          refetch: vi.fn(),
        } as unknown as ReturnType<typeof useSchemaSync>["edgeDiscoveryQuery"],
      }),
    );

    render(
      <EdgeDiscoveryBoundary>
        <div>Children</div>
      </EdgeDiscoveryBoundary>,
    );

    expect(screen.getByText("Children")).toBeInTheDocument();
  });

  test("renders children when edgeConnections exists even if edgeConnectionDiscoveryFailed is true", () => {
    mockedUseMaybeActiveSchema.mockReturnValue({
      vertices: [],
      edges: [],
      edgeConnections: [createRandomEdgeConnection()],
      edgeConnectionDiscoveryFailed: true,
    });
    mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

    render(
      <EdgeDiscoveryBoundary>
        <div>Children</div>
      </EdgeDiscoveryBoundary>,
    );

    expect(screen.getByText("Children")).toBeInTheDocument();
  });

  test("renders loading when edgeConnections is undefined and queries are loading", () => {
    mockedUseMaybeActiveSchema.mockReturnValue({
      vertices: [],
      edges: [],
      edgeConnections: undefined,
    });
    mockedUseSchemaSync.mockReturnValue(
      createMockSchemaSync({
        edgeDiscoveryQuery: {
          isLoading: true,
          error: null,
          refetch: vi.fn(),
        } as unknown as ReturnType<typeof useSchemaSync>["edgeDiscoveryQuery"],
      }),
    );

    render(
      <EdgeDiscoveryBoundary>
        <div>Children</div>
      </EdgeDiscoveryBoundary>,
    );

    expect(screen.getByText("Synchronizing...")).toBeInTheDocument();
    expect(screen.queryByText("Children")).not.toBeInTheDocument();
  });

  test("renders error with retry when edgeConnections is undefined and schema query has error", () => {
    mockedUseMaybeActiveSchema.mockReturnValue({
      vertices: [],
      edges: [],
      edgeConnections: undefined,
    });
    mockedUseSchemaSync.mockReturnValue(
      createMockSchemaSync({
        schemaDiscoveryQuery: {
          isLoading: false,
          error: new Error("Schema query failed"),
          refetch: vi.fn(),
        } as unknown as ReturnType<
          typeof useSchemaSync
        >["schemaDiscoveryQuery"],
      }),
    );

    render(
      <EdgeDiscoveryBoundary>
        <div>Children</div>
      </EdgeDiscoveryBoundary>,
    );

    expect(screen.queryByText("Children")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  test("renders error with retry when edgeConnections is undefined and edge query has error", () => {
    mockedUseMaybeActiveSchema.mockReturnValue({
      vertices: [],
      edges: [],
      edgeConnections: undefined,
    });
    mockedUseSchemaSync.mockReturnValue(
      createMockSchemaSync({
        edgeDiscoveryQuery: {
          isLoading: false,
          error: new Error("Query failed"),
          refetch: vi.fn(),
        } as unknown as ReturnType<typeof useSchemaSync>["edgeDiscoveryQuery"],
      }),
    );

    render(
      <EdgeDiscoveryBoundary>
        <div>Children</div>
      </EdgeDiscoveryBoundary>,
    );

    expect(screen.queryByText("Children")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  test("renders failure state when edgeConnections is undefined and discovery failed", () => {
    mockedUseMaybeActiveSchema.mockReturnValue({
      vertices: [],
      edges: [],
      edgeConnections: undefined,
      edgeConnectionDiscoveryFailed: true,
    });
    mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

    render(
      <EdgeDiscoveryBoundary>
        <div>Children</div>
      </EdgeDiscoveryBoundary>,
    );

    expect(screen.getByText(/discovery failed/)).toBeInTheDocument();
    expect(screen.queryByText("Children")).not.toBeInTheDocument();
  });

  test("renders nothing when schema is undefined", () => {
    mockedUseMaybeActiveSchema.mockReturnValue(undefined);
    mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

    const { container } = render(
      <EdgeDiscoveryBoundary>
        <div>Children</div>
      </EdgeDiscoveryBoundary>,
    );

    expect(screen.queryByText("Children")).not.toBeInTheDocument();
    expect(container.innerHTML).toBe("");
  });
});
