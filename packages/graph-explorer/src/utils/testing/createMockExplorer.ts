import { Explorer } from "@/connector";
import { createRandomRawConfiguration } from "./randomData";

export function createMockExplorer(): Explorer {
  return <Explorer>{
    fetchNeighborsCount: vi.fn(),
    keywordSearch: vi.fn(),
    fetchNeighbors: vi.fn(),
    fetchVertexCountsByType: vi.fn(),
    connection: createRandomRawConfiguration().connection!,
    fetchSchema: vi.fn(),
    bulkVertexDetails: vi.fn(),
    edgeDetails: vi.fn(),
    vertexDetails: vi.fn(),
    rawQuery: vi.fn(),
  };
}
