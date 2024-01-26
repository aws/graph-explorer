import { useCallback, useMemo, useState } from "react";
import type { Edge, Vertex } from "../../@types/entities";
import { ModuleContainerFooter, VertexIcon } from "../../components";
import Button from "../../components/Button";
import { useConfiguration, useWithTheme, withClassNamePrefix } from "../../core";
import defaultStyles from "../CreateConnection/CreateConnection.styles";
import PanelEmptyState from "../../components/PanelEmptyState/PanelEmptyState";
import ExpandGraphIcon from "../../components/icons/ExpandGraphIcon";
import GraphIcon from "../../components/icons/GraphIcon";
import useTranslations from "../../hooks/useTranslations";
import fade from "../../core/ThemeProvider/utils/fade";
import useTextTransform from "../../hooks/useTextTransform";
import useNeighborsOptions from "../../hooks/useNeighborsOptions";
import useDisplayNames from "../../hooks/useDisplayNames";


export type MultiDetailsContentProps = {
    classNamePrefix?: string,
    graphItems: Set<string>;
    vertex: Vertex;
    odFlag: boolean;
    overDate: string;
};

const MultiDetailsContent = ({
    classNamePrefix = "ft",
    graphItems,
    vertex,
    odFlag,
    overDate
}: MultiDetailsContentProps) => {
    const config = useConfiguration();
    const t = useTranslations();
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
                <div className={pfx("title")}>
                    {displayLabels || vertex.data.type}
                </div>
                <div>{name}</div>
                </div>
            </div>
            {vertex.data.neighborsCount === 0 && (
            <PanelEmptyState
            icon={<GraphIcon />}
            title={t("multi-details.no-selection-title")}
            subtitle={t("multi-details.no-connections-subtitle")}
            />
            )}
        </div>
    );
};

export default MultiDetailsContent;