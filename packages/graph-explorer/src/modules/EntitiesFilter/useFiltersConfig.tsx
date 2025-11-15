import { EdgeIcon } from "@/components/icons";
import { VertexIconByType, type CheckboxListItemProps } from "@/components";
import {
  edgesTypesFilteredAtom,
  edgeTypesSelector,
  nodesTypesFilteredAtom,
  useDisplayEdgeTypeConfigs,
  useDisplayVertexTypeConfigs,
  vertexTypesSelector,
} from "@/core";
import { atom, useAtomValue, useSetAtom } from "jotai";

const selectedVerticesSelector = atom(get => {
  const filteredNodeTypes = get(nodesTypesFilteredAtom);
  const allNodeTypes = get(vertexTypesSelector);
  return new Set(
    [...allNodeTypes].filter(n => filteredNodeTypes.has(n) === false)
  );
});

const selectedEdgesSelector = atom(get => {
  const filteredEdgeTypes = get(edgesTypesFilteredAtom);
  const allEdgeTypes = get(edgeTypesSelector);
  return new Set(
    [...allEdgeTypes].filter(n => filteredEdgeTypes.has(n) === false)
  );
});

const useFiltersConfig = () => {
  const vtConfigs = useDisplayVertexTypeConfigs();
  const etConfigs = useDisplayEdgeTypeConfigs();
  const setNodesTypesFiltered = useSetAtom(nodesTypesFilteredAtom);
  const setEdgesTypesFiltered = useSetAtom(edgesTypesFilteredAtom);
  const selectedVertexTypes = useAtomValue(selectedVerticesSelector);
  const selectedConnectionTypes = useAtomValue(selectedEdgesSelector);

  const addVertex = (vertex: string) => {
    setNodesTypesFiltered(
      prevVertexList => new Set([...prevVertexList, vertex])
    );
  };

  const deleteVertex = (vertex: string) => {
    setNodesTypesFiltered(
      prevVertexList =>
        new Set([...prevVertexList].filter(prevVertex => prevVertex !== vertex))
    );
  };

  const addConnection = (connection: string) => {
    setEdgesTypesFiltered(
      prevConnectionList => new Set([...prevConnectionList, connection])
    );
  };

  const deleteConnection = (connection: string) => {
    setEdgesTypesFiltered(
      prevConnectionList =>
        new Set(
          [...prevConnectionList].filter(
            prevConnection => prevConnection !== connection
          )
        )
    );
  };

  const onChangeVertexTypes = (vertexId: string, isSelected: boolean): void => {
    isSelected ? deleteVertex(vertexId) : addVertex(vertexId);
  };

  const onChangeAllVertexTypes = (isSelected: boolean): void => {
    setNodesTypesFiltered(isSelected ? new Set() : new Set(vtConfigs.keys()));
  };

  const onChangeConnectionTypes = (
    connectionId: string,
    isSelected: boolean
  ): void => {
    isSelected ? deleteConnection(connectionId) : addConnection(connectionId);
  };

  const onChangeAllConnectionTypes = (isSelected: boolean): void => {
    setEdgesTypesFiltered(isSelected ? new Set() : new Set(etConfigs.keys()));
  };

  const vertexTypesCheckboxes = vtConfigs
    .values()
    .map(vertexConfig => {
      return {
        id: vertexConfig.type,
        text: vertexConfig.displayLabel,
        endAdornment: <VertexIconByType vertexType={vertexConfig.type} />,
      } as CheckboxListItemProps;
    })
    .toArray();

  const connectionTypesCheckboxes = etConfigs
    .values()
    .map(edgeConfig => {
      return {
        id: edgeConfig.type,
        text: edgeConfig.displayLabel,
        endAdornment: <EdgeIcon />,
      } as CheckboxListItemProps;
    })
    .toArray();

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
