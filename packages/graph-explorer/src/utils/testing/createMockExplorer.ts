import { Explorer } from "@/connector/useGEFetchTypes";
import { createRandomRawConfiguration } from "./randomData";

export function createMockExplorer(): Explorer {
  return {
    fetchNeighborsCount: vi.fn(),
    keywordSearch: vi.fn(),
    fetchNeighbors: vi.fn(),
    fetchVertexCountsByType: vi.fn(),
    connection: createRandomRawConfiguration().connection!,
    fetchSchema: vi.fn(),
  };
}
