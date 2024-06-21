import useNeighborsOptions from "./useNeighborsOptions";
import { Vertex } from "../@types/entities";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "../core/StateProvider/configuration";
import {
  createRandomRawConfiguration,
  renderHookWithRecoilRoot,
} from "../utils/testing";

describe("useNeighborsOptions", () => {
  const vertex = {
    data: {
      neighborsCountByType: { nodeType1: 5, nodeType2: 3 },
      __unfetchedNeighborCounts: { nodeType1: 0, nodeType2: 1 },
    },
  } as unknown as Vertex;

  it("should return neighbors options correctly", () => {
    const { result } = renderHookWithRecoilRoot(
      () => useNeighborsOptions(vertex),
      snapshot => {
        const config = createRandomRawConfiguration();
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
    ]);
  });
});
