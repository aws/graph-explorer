import useNeighborsOptions from "./useNeighborsOptions";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/configuration";
import {
  createRandomEdge,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertex,
  renderHookWithRecoilRoot,
} from "@/utils/testing";
import { schemaAtom } from "@/core/StateProvider/schema";
import { NeighborCountsQueryResponse } from "@/connector";
import {
  edgesAtom,
  explorerForTestingAtom,
  nodesAtom,
  toEdgeMap,
  toNodeMap,
} from "@/core";
import { waitFor } from "@testing-library/react";
import { createArray } from "@shared/utils/testing";
import { createMockExplorer } from "@/utils/testing/createMockExplorer";

describe("useNeighborsOptions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return neighbors options correctly", async () => {
    const vertex = createRandomVertex();
    const nodeType1Neighbors = createArray(5, () => {
      const neighbors = createRandomVertex();
      neighbors.type = "nodeType1";
      return neighbors;
    });
    const edges = nodeType1Neighbors.map(neighbor =>
      createRandomEdge(vertex, neighbor)
    );
    const mockExplorer = createMockExplorer();
    const response: NeighborCountsQueryResponse = {
      nodeId: vertex.id,
      totalCount: 8,
      counts: { nodeType1: 5, nodeType2: 3 },
    };
    vi.mocked(mockExplorer.fetchNeighborsCount).mockResolvedValueOnce(response);

    const { result } = renderHookWithRecoilRoot(
      () => useNeighborsOptions(vertex),
      snapshot => {
        const config = createRandomRawConfiguration();
        const schema = createRandomSchema();
        schema.vertices = [
          {
            type: "nodeType1",
            displayLabel: "Label nodeType1",
            attributes: [],
          },
          {
            type: "nodeType2",
            displayLabel: "Label nodeType2",
            attributes: [],
          },
        ];
        snapshot.set(configurationAtom, new Map([[config.id, config]]));
        snapshot.set(schemaAtom, new Map([[config.id, schema]]));
        snapshot.set(activeConfigurationAtom, config.id);
        snapshot.set(explorerForTestingAtom, mockExplorer);
        snapshot.set(nodesAtom, toNodeMap([vertex, ...nodeType1Neighbors]));
        snapshot.set(edgesAtom, toEdgeMap(edges));
      }
    );

    await waitFor(() =>
      expect(
        result.current.map(option => ({
          ...option,
          // We only care about verifying the displayLabel property
          config: { displayLabel: option.config?.displayLabel },
        }))
      ).toEqual([
        {
          label: "Label nodeType1",
          value: "nodeType1",
          isDisabled: true,
          config: { displayLabel: "Label nodeType1" },
        },
        {
          label: "Label nodeType2",
          value: "nodeType2",
          isDisabled: false,
          config: { displayLabel: "Label nodeType2" },
        },
      ])
    );
  });
});
