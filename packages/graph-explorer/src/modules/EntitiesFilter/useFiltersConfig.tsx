import sortBy from "lodash/sortBy";
import { useCallback, useMemo } from "react";
import { selector, useRecoilValue, useSetRecoilState } from "recoil";
import { EdgeIcon } from "../../components/icons";
import VertexIcon from "../../components/VertexIcon";
import { useConfiguration } from "../../core";
import { edgesTypesFilteredAtom } from "../../core/StateProvider/edges";
import { nodesTypesFilteredAtom } from "../../core/StateProvider/nodes";
import useTextTransform from "../../hooks/useTextTransform";
import {
  edgeTypesSelector,
  vertexTypesSelector,
} from "../../core/StateProvider/configuration";
import { CheckboxListItemProps } from "../../components";
import { useVertexTypeConfigs } from "../../core/ConfigurationProvider/useConfiguration";

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
  const config = useConfiguration();
  const textTransform = useTextTransform();

  const vertexTypes = useRecoilValue(vertexTypesSelector);
  const vtConfigs = useVertexTypeConfigs();
  const edgeTypes = useRecoilValue(edgeTypesSelector);
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
      setNodesTypesFiltered(isSelected ? new Set() : new Set(vertexTypes));
    },
    [vertexTypes, setNodesTypesFiltered]
  );

  const { getEdgeTypeConfig } = config || {};

  const onChangeConnectionTypes = useCallback(
    (connectionId: string, isSelected: boolean): void => {
      isSelected ? deleteConnection(connectionId) : addConnection(connectionId);
    },
    [addConnection, deleteConnection]
  );

  const onChangeAllConnectionTypes = useCallback(
    (isSelected: boolean): void => {
      setEdgesTypesFiltered(isSelected ? new Set() : new Set(edgeTypes));
    },
    [edgeTypes, setEdgesTypesFiltered]
  );

  const vertexTypesCheckboxes = useMemo(() => {
    return sortBy(
      vtConfigs.map(vertexConfig => {
        const vt = vertexConfig.type;

        return {
          id: vt,
          text: vertexConfig?.displayLabel || textTransform(vt),
          endAdornment: (
            <div
              style={{
                color: vertexConfig?.color,
              }}
            >
              <VertexIcon
                iconUrl={vertexConfig?.iconUrl}
                iconImageType={vertexConfig?.iconImageType}
              />
            </div>
          ),
        } as CheckboxListItemProps;
      }),
      type => type.text
    );
  }, [vtConfigs, textTransform]);

  const connectionTypesCheckboxes = useMemo(() => {
    return sortBy(
      edgeTypes?.map(et => {
        const edgeConfig = getEdgeTypeConfig?.(et);
        return {
          id: et,
          text: edgeConfig?.displayLabel || textTransform(et),
          endAdornment: <EdgeIcon />,
        } as CheckboxListItemProps;
      }),
      type => type.text
    );
  }, [edgeTypes, getEdgeTypeConfig, textTransform]);

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
