import type { Explorer } from "@/connector";

import { normalizeConnection } from "@/core/StateProvider/configuration";

import { createRandomRawConfiguration } from "./randomData";

export function createMockExplorer(): Explorer {
  return {
    neighborCounts: vi.fn(),
    keywordSearch: vi.fn(),
    fetchNeighbors: vi.fn(),
    fetchVertexCountsByType: vi.fn(),
    connection: normalizeConnection(createRandomRawConfiguration().connection!),
    fetchSchema: vi.fn(),
    edgeDetails: vi.fn(),
    vertexDetails: vi.fn(),
    rawQuery: vi.fn(),
    fetchEdgeConnections: vi.fn(),
  } as Explorer;
}
