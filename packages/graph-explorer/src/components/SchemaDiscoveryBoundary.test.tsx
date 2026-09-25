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
    useConfiguration: vi.fn(),
  };
});

vi.mock("@/hooks/useSchemaSync", () => ({
  useSchemaSync: vi.fn(),
  useCancelSchemaSync: vi.fn(() => vi.fn()),
}));

import { useConfiguration, useHasActiveSchema } from "@/core";
import { useSchemaSync } from "@/hooks/useSchemaSync";

const mockedUseConfiguration = vi.mocked(useConfiguration);
const mockedUseHasActiveSchema = vi.mocked(useHasActiveSchema);
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
}: {
  hasSchema?: boolean;
  hasConnection?: boolean;
} = {}) {
  mockedUseConfiguration.mockReturnValue(
    hasConnection ? ({} as ReturnType<typeof useConfiguration>) : undefined,
  );
  mockedUseHasActiveSchema.mockReturnValue(hasSchema);
}

describe("SchemaDiscoveryBoundary", () => {
  function renderBoundary() {
    return render(
      <MemoryRouter>
        <SchemaDiscoveryBoundary>
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
  });

  describe("schema discovery", () => {
    test("renders children when schema is available", () => {
      mockSchema({ hasSchema: true });
      mockedUseSchemaSync.mockReturnValue(createMockSchemaSync());

      renderBoundary();

      expect(screen.getByText("Children")).toBeInTheDocument();
    });

    test("renders children when schema exists even if edge discovery failed", () => {
      mockSchema({ hasSchema: true });
      mockedUseSchemaSync.mockReturnValue(
        createMockSchemaSync({
          edgeDiscoveryQuery: {
            isFetching: false,
            error: new Error("Edge connection discovery failed"),
            refetch: vi.fn(),
          } as unknown as ReturnType<
            typeof useSchemaSync
          >["edgeDiscoveryQuery"],
        }),
      );

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
});
