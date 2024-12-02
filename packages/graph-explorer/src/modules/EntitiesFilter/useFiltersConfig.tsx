import { useCallback, useMemo } from "react";
import { selector, useRecoilValue, useSetRecoilState } from "recoil";
import { EdgeIcon } from "@/components/icons";
import VertexIcon from "@/components/VertexIcon";
import { edgesTypesFilteredAtom } from "@/core/StateProvider/edges";
import { nodesTypesFilteredAtom } from "@/core/StateProvider/nodes";
import {
  edgeTypesSelector,
  vertexTypesSelector,
} from "@/core/StateProvider/configuration";
import { CheckboxListItemProps } from "@/components";
import { useDisplayEdgeTypeConfigs, useDisplayVertexTypeConfigs } from "@/core";

const selectedVerticesSelector = selector({
  key: "filters-selected-vertices",
  get: ({ get }) => {
    const filteredNodeTypes = get(nodesTypesFilteredAtom);
    const allNodeTypes = get(vertexTypesSelector);
    return new Set(
      [...allNodeTypes].filter(n => filteredNodeTypes.has(n) === false)
    );
  },
});

const selectedEdgesSelector = selector({
  key: "filters-selected-edges",
  get: ({ get }) => {
    const filteredEdgeTypes = get(edgesTypesFilteredAtom);
    const allEdgeTypes = get(edgeTypesSelector);
    return new Set(
      [...allEdgeTypes].filter(n => filteredEdgeTypes.has(n) === false)
    );
  },
});

const useFiltersConfig = () => {
  const vtConfigs = useDisplayVertexTypeConfigs();
  const etConfigs = useDisplayEdgeTypeConfigs();
  const setNodesTypesFiltered = useSetRecoilState(nodesTypesFilteredAtom);
  const setEdgesTypesFiltered = useSetRecoilState(edgesTypesFilteredAtom);
  const selectedVertexTypes = useRecoilValue(selectedVerticesSelector);
  const selectedConnectionTypes = useRecoilValue(selectedEdgesSelector);

  const addVertex = useCallback(
    (vertex: string) => {
      setNodesTypesFiltered(
        prevVertexList => new Set([...prevVertexList, vertex])
      );
    },
    [setNodesTypesFiltered]
  );

  const deleteVertex = useCallback(
    (vertex: string) => {
      setNodesTypesFiltered(
        prevVertexList =>
          new Set(
            [...prevVertexList].filter(prevVertex => prevVertex !== vertex)
          )
      );
    },
    [setNodesTypesFiltered]
  );

  const addConnection = useCallback(
    (connection: string) => {
      setEdgesTypesFiltered(
        prevConnectionList => new Set([...prevConnectionList, connection])
      );
    },
    [setEdgesTypesFiltered]
  );

  const deleteConnection = useCallback(
    (connection: string) => {
      setEdgesTypesFiltered(
        prevConnectionList =>
          new Set(
            [...prevConnectionList].filter(
              prevConnection => prevConnection !== connection
            )
          )
      );
    },
    [setEdgesTypesFiltered]
  );

  const onChangeVertexTypes = useCallback(
    (vertexId: string, isSelected: boolean): void => {
      isSelected ? deleteVertex(vertexId) : addVertex(vertexId);
    },
    [addVertex, deleteVertex]
  );

  const onChangeAllVertexTypes = useCallback(
    (isSelected: boolean): void => {
      setNodesTypesFiltered(isSelected ? new Set() : new Set(vtConfigs.keys()));
    },
    [setNodesTypesFiltered, vtConfigs]
  );

  const onChangeConnectionTypes = useCallback(
    (connectionId: string, isSelected: boolean): void => {
      isSelected ? deleteConnection(connectionId) : addConnection(connectionId);
    },
    [addConnection, deleteConnection]
  );

  const onChangeAllConnectionTypes = useCallback(
    (isSelected: boolean): void => {
      setEdgesTypesFiltered(isSelected ? new Set() : new Set(etConfigs.keys()));
    },
    [etConfigs, setEdgesTypesFiltered]
  );

  const vertexTypesCheckboxes = useMemo(() => {
    return vtConfigs
      .values()
      .map(vertexConfig => {
        return {
          id: vertexConfig.type,
          text: vertexConfig.displayLabel,
          endAdornment: (
            <div
              style={{
                color: vertexConfig.style.color,
              }}
            >
              <VertexIcon vertexStyle={vertexConfig.style} />
            </div>
          ),
        } as CheckboxListItemProps;
      })
      .toArray();
  }, [vtConfigs]);

  const connectionTypesCheckboxes = useMemo(() => {
    return etConfigs
      .values()
      .map(edgeConfig => {
        return {
          id: edgeConfig.type,
          text: edgeConfig.displayLabel,
          endAdornment: <EdgeIcon />,
        } as CheckboxListItemProps;
      })
      .toArray();
  }, [etConfigs]);

  return {
    selectedVertexTypes,
    vertexTypes: vertexTypesCheckboxes,
    onChangeVertexTypes,
    onChangeAllVertexTypes,
    selectedConnectionTypes,
    connectionTypes: connectionTypesCheckboxes,
    onChangeConnectionTypes,
    onChangeAllConnectionTypes,
  };
};

export default useFiltersConfig;
