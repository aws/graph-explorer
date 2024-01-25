import { useCallback, useMemo, useState } from "react";
import type { Edge, Vertex } from "../../@types/entities";
import { ModuleContainerFooter, VertexIcon } from "../../components";
import Button from "../../components/Button";
import { useConfiguration, useWithTheme, withClassNamePrefix } from "../../core";
import defaultStyles from "../CreateConnection/CreateConnection.styles";
import fade from "../../core/ThemeProvider/utils/fade";
import useTextTransform from "../../hooks/useTextTransform";
import useNeighborsOptions from "../../hooks/useNeighborsOptions";
import useDisplayNames from "../../hooks/useDisplayNames";

export type MultiDetailsContentProps = {
    classNamePrefix?: string,
    vertex: Vertex;
    odFlag: boolean;
    overDate: string;
};

const MultiDetailsContent = ({
    classNamePrefix = "ft",
    vertex,
    odFlag,
    overDate
}: MultiDetailsContentProps) => {
    const config = useConfiguration
    const styleWithTheme = useWithTheme();
    const pfx = withClassNamePrefix(classNamePrefix)
    const neighborsOptions = useNeighborsOptions(vertex);
    const textTransform = useTextTransform();

    const [isExpanding, setIsExpanding] = useState(false);
    const [selectedType, setSelectedType] = useState<string>(
        neighborsOptions[0]?.value
      );
    const [filters, setFilters] = [null, null];
    const [limit, setLimit] = useState<number | null>(null);

    const displayLabels = useMemo(() => {
        return (vertex.data.types ?? [vertex.data.type])
          .map(type => {
            return (
              config?.getVertexTypeConfig(type)?.displayLabel || textTransform(type)
            );
          })
          .filter(Boolean)
          .join(", ");
      }, [config, textTransform, vertex.data.type, vertex.data.types]);
    
      const getDisplayNames = useDisplayNames();
      const { name } = getDisplayNames(vertex);
      const vtConfig = config?.getVertexTypeConfig(vertex.data.type);

    return(
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
          <div className={pfx("title")}>
            {displayLabels || vertex.data.type}
          </div>
          <div>{name}</div>
        </div>
      </div>
    );
};

export default MultiDetailsContent;