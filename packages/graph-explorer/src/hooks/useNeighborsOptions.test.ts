/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest } from "@jest/globals";
import useNeighborsOptions from "./useNeighborsOptions";
import renderHookWithRecoilRoot from "../utils/testing/renderHookWithRecoilRoot";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "../core/StateProvider/configuration";
import {
  createRandomEdge,
  createRandomRawConfiguration,
  createRandomVertex,
} from "../utils/testing/randomData";
import { waitForValueToChange } from "../utils/testing/waitForValueToChange";
import { Explorer } from "../connector/useGEFetchTypes";
import { nodesAtom } from "../core/StateProvider/nodes";
import { edgesAtom } from "../core/StateProvider/edges";

// Create the mock instance
const mockExplorer: jest.Mocked<Explorer> = {
  fetchSchema: jest.fn(),
  fetchVertexCountsByType: jest.fn(),
  fetchNeighbors: jest.fn(),
  fetchNeighborsCount: jest.fn(),
  keywordSearch: jest.fn(),
};

jest.mock("../connector/gremlin/gremlinExplorer", () => ({
  createGremlinExplorer: () => mockExplorer,
}));

describe("useNeighborsOptions", () => {
  it("should return neighbors options correctly", async () => {
    const vertex = createRandomVertex();

    mockExplorer.fetchNeighborsCount.mockResolvedValueOnce({
      totalCount: 8,
      counts: { nodeType1: 5, nodeType2: 3 },
    });

    const { result } = renderHookWithRecoilRoot(
      () => useNeighborsOptions(vertex),
      snapshot => {
        const config = createRandomRawConfiguration();
        config.connection!.queryEngine = "gremlin";
        config.schema!.vertices = [
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
        snapshot.set(activeConfigurationAtom, config.id);
      }
    );

    await waitForValueToChange(() => result.current.data);

    expect(mockExplorer.fetchNeighborsCount).toBeCalled();

    expect(
      result.current.data?.options.map(option => ({
        ...option,
        // We only care about verifying the displayLabel property
        config: { displayLabel: option.config?.displayLabel },
      }))
    ).toEqual([
      {
        label: "Label nodeType1",
        value: "nodeType1",
        isDisabled: false,
        config: { displayLabel: "Label nodeType1" },
        addedCount: 0,
        collapsedCount: 5,
        totalCount: 5,
      },
      {
        label: "Label nodeType2",
        value: "nodeType2",
        isDisabled: false,
        config: { displayLabel: "Label nodeType2" },
        addedCount: 0,
        collapsedCount: 3,
        totalCount: 3,
      },
    ]);
  });

  it("should calculate collapsed and added properly", async () => {
    const vertex = createRandomVertex();

    const neighborAlreadyAdded = createRandomVertex();
    neighborAlreadyAdded.data.type = "nodeType1";
    const addedEdge = createRandomEdge(vertex, neighborAlreadyAdded);

    mockExplorer.fetchNeighborsCount.mockResolvedValueOnce({
      totalCount: 8,
      counts: { nodeType1: 5, nodeType2: 3 },
    });

    const { result } = renderHookWithRecoilRoot(
      () => useNeighborsOptions(vertex),
      snapshot => {
        const config = createRandomRawConfiguration();
        config.connection!.queryEngine = "gremlin";
        config.schema!.vertices = [
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
        // config.schema!.totalVertices = 8;
        snapshot.set(configurationAtom, new Map([[config.id, config]]));
        snapshot.set(activeConfigurationAtom, config.id);
        snapshot.set(nodesAtom, [neighborAlreadyAdded]);
        snapshot.set(edgesAtom, [addedEdge]);
      }
    );

    await waitForValueToChange(() => result.current.data?.collapsedCount);

    expect(mockExplorer.fetchNeighborsCount).toBeCalled();

    const results = result.current.data && {
      ...result.current.data,
      options: result.current.data.options.map(option => ({
        ...option,
        // We only care about verifying the displayLabel property
        config: { displayLabel: option.config?.displayLabel },
      })),
    };

    expect(results).toEqual({
      addedCount: 1,
      collapsedCount: 7,
      totalCount: 8,
      options: [
        {
          label: "Label nodeType1",
          value: "nodeType1",
          isDisabled: false,
          config: { displayLabel: "Label nodeType1" },
          addedCount: 1,
          collapsedCount: 4,
          totalCount: 5,
        },
        {
          label: "Label nodeType2",
          value: "nodeType2",
          isDisabled: false,
          config: { displayLabel: "Label nodeType2" },
          addedCount: 0,
          collapsedCount: 3,
          totalCount: 3,
        },
      ],
    });
  });

  it("should disable when fully expanded", async () => {
    const vertex = createRandomVertex();

    const neighborAlreadyAdded = createRandomVertex();
    neighborAlreadyAdded.data.type = "nodeType1";
    const addedEdge = createRandomEdge(vertex, neighborAlreadyAdded);

    mockExplorer.fetchNeighborsCount.mockResolvedValueOnce({
      totalCount: 1,
      counts: { nodeType1: 1 },
    });

    const { result } = renderHookWithRecoilRoot(
      () => useNeighborsOptions(vertex),
      snapshot => {
        const config = createRandomRawConfiguration();
        config.connection!.queryEngine = "gremlin";
        config.schema!.vertices = [
          {
            type: "nodeType1",
            displayLabel: "Label nodeType1",
            attributes: [],
          },
        ];
        snapshot.set(configurationAtom, new Map([[config.id, config]]));
        snapshot.set(activeConfigurationAtom, config.id);
        snapshot.set(nodesAtom, [neighborAlreadyAdded]);
        snapshot.set(edgesAtom, [addedEdge]);
      }
    );

    await waitForValueToChange(() => result.current.data?.collapsedCount);

    expect(result.current.data?.options[0].isDisabled).toBeTruthy();
  });
});
