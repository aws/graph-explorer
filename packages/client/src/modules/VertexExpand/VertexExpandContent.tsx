import { useCallback, useEffect, useMemo, useState } from "react";
import type { Vertex } from "../../@types/entities";
import type { CheckboxListItemProps } from "../../components";
import { CheckboxList, VertexIcon } from "../../components";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import ExpandGraphIcon from "../../components/icons/ExpandGraphIcon";
import LoadingSpinner from "../../components/LoadingSpinner";
import PanelEmptyState from "../../components/PanelEmptyState/PanelEmptyState";
import { useWithTheme, withClassNamePrefix } from "../../core";
import useConfiguration from "../../core/ConfigurationProvider/useConfiguration";
import fade from "../../core/ThemeProvider/utils/fade";
import { useExpandNode } from "../../hooks";
import useDisplayNames from "../../hooks/useDisplayNames";
import useTextTransform from "../../hooks/useTextTransform";
import defaultStyles from "./VertexExpandContent.styles";

export type VertexDetailProps = {
  classNamePrefix?: string;
  vertex: Vertex;
};

const VertexExpand = ({
  classNamePrefix = "ft",
  vertex,
}: VertexDetailProps) => {
  const config = useConfiguration();
  const expandNode = useExpandNode();
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [isExpanding, setIsExpanding] = useState(false);

  const textTransform = useTextTransform();
  const vertexTypesCheckboxes = useMemo(() => {
    return Object.keys(vertex.data.__totalNeighborCounts).reduce(
      (options, type) => {
        const vConfig = config?.getVertexTypeConfig(type);
        options.push({
          id: type,
          text: (
            <div className={pfx("vertex-type")}>
              <div
                style={{
                  color: vConfig?.color,
                }}
              >
                <VertexIcon
                  iconUrl={vConfig?.iconUrl}
                  iconImageType={vConfig?.iconImageType}
                />
              </div>
              {vConfig?.displayLabel || textTransform(type)}
            </div>
          ),
          isDisabled: vertex.data.__unfetchedNeighborCounts[type] === 0,
          endAdornment: (
            <Chip className={pfx("chip")}>
              {vertex.data.__unfetchedNeighborCounts[type]}
            </Chip>
          ),
        });

        return options;
      },
      [] as CheckboxListItemProps[]
    );
  }, [
    config,
    pfx,
    vertex.data.__totalNeighborCounts,
    vertex.data.__unfetchedNeighborCounts,
    textTransform,
  ]);

  const addVertexType = useCallback(
    (vertex: string) => {
      setSelectedTypes(prevVertexList => new Set([...prevVertexList, vertex]));
    },
    [setSelectedTypes]
  );

  const deleteVertexType = useCallback(
    (vertex: string) => {
      setSelectedTypes(
        prevVertexList =>
          new Set(
            [...prevVertexList].filter(prevVertex => prevVertex !== vertex)
          )
      );
    },
    [setSelectedTypes]
  );

  const onSelectedTypesChange = useCallback(
    (id: string, isSelected: boolean) => {
      if (isSelected) {
        addVertexType(id);
        return;
      }

      deleteVertexType(id);
    },
    [addVertexType, deleteVertexType]
  );

  const onSelectedAllTypesChange = useCallback(
    (isSelected: boolean) => {
      if (isSelected) {
        const onlyPendingTypes = Object.entries(
          vertex.data.__unfetchedNeighborCounts
        ).reduce((types, [type, count]) => {
          if (count === 0) {
            return types;
          }

          types.push(type);
          return types;
        }, [] as string[]);

        setSelectedTypes(new Set(onlyPendingTypes));
        return;
      }

      setSelectedTypes(new Set());
    },
    [vertex.data.__unfetchedNeighborCounts]
  );

  const onExpandClick = useCallback(async () => {
    setIsExpanding(true);
    await expandNode({
      vertexId: vertex.data.id,
      vertexTypes: Array.from(selectedTypes),
      // Fetch with the total count as limit to avoid
      // missing vertices/edges constrained by vertexTypes
      limit: vertex.data.__totalNeighborCount,
      offset: 0,
    });
    setIsExpanding(false);
  }, [
    expandNode,
    selectedTypes,
    vertex.data.__totalNeighborCount,
    vertex.data.id,
  ]);

  const displayLabels = useMemo(() => {
    return vertex.data.__v_types
      .map(type => {
        return (
          config?.getVertexTypeConfig(type)?.displayLabel || textTransform(type)
        );
      })
      .filter(Boolean)
      .join(", ");
  }, [config, textTransform, vertex.data.__v_types]);

  useEffect(() => {
    setSelectedTypes(new Set());
  }, [vertex]);

  const getDisplayNames = useDisplayNames();
  const { name } = getDisplayNames(vertex);
  const vtConfig = config?.getVertexTypeConfig(vertex.data.__v_type);
  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <div className={pfx("header")}>
        {vtConfig?.iconUrl && (
          <div
            className={pfx("icon")}
            style={{
              background: fade(vtConfig?.color, 0.2),
              color: vtConfig?.color,
            }}
          >
            <VertexIcon
              iconUrl={vtConfig?.iconUrl}
              iconImageType={vtConfig?.iconImageType}
            />
          </div>
        )}
        <div className={pfx("content")}>
          <div className={pfx("title")}>{name}</div>
          <div>{displayLabels || vertex.data.__v_type}</div>
        </div>
      </div>
      <div className={pfx("neighbors-count")}>
        {vertexTypesCheckboxes.length === 0 && (
          <div className={pfx("content")}>
            <PanelEmptyState
              title={"Unconnected Node"}
              subtitle={
                "This node has no connection. Therefore, it is not expandable"
              }
            />
          </div>
        )}
        {vertexTypesCheckboxes.length > 0 && (
          <div className={pfx("content")}>
            <CheckboxList
              title={"Neighbors & Count"}
              selectedIds={selectedTypes}
              checkboxes={vertexTypesCheckboxes}
              onChange={onSelectedTypesChange}
              onChangeAll={onSelectedAllTypesChange}
            />
          </div>
        )}
      </div>
      <div className={pfx("actions")}>
        <Button
          icon={
            isExpanding ? (
              <LoadingSpinner style={{ width: 24, height: 24 }} />
            ) : (
              <ExpandGraphIcon />
            )
          }
          variant={"filled"}
          isDisabled={isExpanding || selectedTypes.size === 0}
          onPress={onExpandClick}
        >
          Expand
        </Button>
      </div>
    </div>
  );
};

export default VertexExpand;
