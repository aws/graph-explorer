import sortBy from "lodash/sortBy";
import { useCallback, useMemo } from "react";
import { useRecoilState } from "recoil";
import { EdgeIcon, VertexIcon } from "../../components";
import { useConfiguration } from "../../core";
import { edgesTypesFilteredAtom } from "../../core/StateProvider/edges";
import { nodesTypesFilteredAtom } from "../../core/StateProvider/nodes";
import useTextTransform from "../../hooks/useTextTransform";

const useFiltersConfig = () => {
  const config = useConfiguration();
  const textTransform = useTextTransform();

  const [nodesTypesFiltered, setNodesTypesFiltered] = useRecoilState(
    nodesTypesFilteredAtom
  );
  const [edgesTypesFiltered, setEdgesTypesFiltered] = useRecoilState(
    edgesTypesFilteredAtom
  );

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
      isSelected ? addVertex(vertexId) : deleteVertex(vertexId);
    },
    [addVertex, deleteVertex]
  );

  const onChangeAllVertexTypes = useCallback(
    (isSelected: boolean): void => {
      setNodesTypesFiltered(
        isSelected ? new Set(config?.vertexTypes || []) : new Set()
      );
    },
    [config?.vertexTypes, setNodesTypesFiltered]
  );

  const { vertexTypes, edgeTypes, getVertexTypeConfig, getEdgeTypeConfig } =
    config || {};

  const onChangeConnectionTypes = useCallback(
    (connectionId: string, isSelected: boolean): void => {
      isSelected ? addConnection(connectionId) : deleteConnection(connectionId);
    },
    [addConnection, deleteConnection]
  );

  const onChangeAllConnectionTypes = useCallback(
    (isSelected: boolean): void => {
      setEdgesTypesFiltered(
        isSelected ? new Set(config?.edgeTypes || []) : new Set()
      );
    },
    [config?.edgeTypes, setEdgesTypesFiltered]
  );

  const vertexTypesCheckboxes = useMemo(() => {
    return sortBy(
      vertexTypes?.map(vt => {
        const vertexConfig = getVertexTypeConfig?.(vt);

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
          isSelected: nodesTypesFiltered.has(vt),
        };
      }),
      type => type.text
    );
  }, [vertexTypes, getVertexTypeConfig, textTransform, nodesTypesFiltered]);

  const connectionTypesCheckboxes = useMemo(() => {
    return sortBy(
      edgeTypes?.map(et => {
        const edgeConfig = getEdgeTypeConfig?.(et);
        return {
          id: et,
          text: edgeConfig?.displayLabel || textTransform(et),
          endAdornment: <EdgeIcon />,
          isSelected: edgesTypesFiltered.has(et),
        };
      }),
      type => type.text
    );
  }, [edgeTypes, getEdgeTypeConfig, edgesTypesFiltered, textTransform]);

  return {
    selectedVertexTypes: nodesTypesFiltered,
    vertexTypes: vertexTypesCheckboxes,
    onChangeVertexTypes,
    onChangeAllVertexTypes,
    selectedConnectionTypes: edgesTypesFiltered,
    connectionTypes: connectionTypesCheckboxes,
    onChangeConnectionTypes,
    onChangeAllConnectionTypes,
  };
};

export default useFiltersConfig;
