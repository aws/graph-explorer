import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { SchemaDiscoveryBoundary } from "./SchemaDiscoveryBoundary";

vi.mock("@/core", async () => {
  const actual = await vi.importActual("@/core");
  return {
    ...actual,
    useHasActiveSchema: vi.fn(),
  };
});

vi.mock("@/hooks/useSchemaSync", () => ({
  useSchemaSync: vi.fn(),
  useCancelSchemaSync: vi.fn(() => vi.fn()),
}));

import { useHasActiveSchema } from "@/core";
import { useSchemaSync } from "@/hooks/useSchemaSync";

const mockedUseHasActiveSchema = vi.mocked(useHasActiveSchema);
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

describe("SchemaDiscoveryBoundary", () => {
  test("renders children when schema is available", () => {
    mockedUseHasActiveSchema.mockReturnValue(true);
    mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

    render(
      <SchemaDiscoveryBoundary>
        <div>Schema content</div>
      </SchemaDiscoveryBoundary>,
    );

    expect(screen.getByText("Schema content")).toBeInTheDocument();
  });

  test("renders loading state when schema is syncing", () => {
    mockedUseHasActiveSchema.mockReturnValue(false);
    mockedUseSchemaSync.mockReturnValue(
      createMockSchemaSync({
        schemaDiscoveryQuery: {
          isLoading: true,
          error: null,
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

    expect(screen.getByText("Synchronizing...")).toBeInTheDocument();
    expect(screen.queryByText("Schema content")).not.toBeInTheDocument();
  });

  test("renders loading state when isFetching without schema", () => {
    mockedUseHasActiveSchema.mockReturnValue(false);
    mockedUseSchemaSync.mockReturnValue(
      createMockSchemaSync({
        schemaDiscoveryQuery: {
          isLoading: false,
          isFetching: true,
          error: null,
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

    expect(screen.getByText("Synchronizing...")).toBeInTheDocument();
    expect(screen.queryByText("Schema content")).not.toBeInTheDocument();
  });

  test("renders children when isFetching with existing schema", () => {
    mockedUseHasActiveSchema.mockReturnValue(true);
    mockedUseSchemaSync.mockReturnValue(
      createMockSchemaSync({
        schemaDiscoveryQuery: {
          isLoading: false,
          isFetching: true,
          error: null,
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

    expect(screen.getByText("Schema content")).toBeInTheDocument();
    expect(screen.queryByText("Synchronizing...")).not.toBeInTheDocument();
  });

  test("renders error state when schema sync fails", () => {
    mockedUseHasActiveSchema.mockReturnValue(false);
    mockedUseSchemaSync.mockReturnValue(
      createMockSchemaSync({
        schemaDiscoveryQuery: {
          isLoading: false,
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
    mockedUseHasActiveSchema.mockReturnValue(false);
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
