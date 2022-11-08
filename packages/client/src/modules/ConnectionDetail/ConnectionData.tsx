import { css } from "@emotion/css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdvancedList,
  AdvancedListItemType,
  ChevronRightIcon,
  Chip,
  EdgeIcon,
  GraphIcon,
  IconButton,
  VertexIcon,
} from "../../components";
import HumanReadableNumberFormatter from "../../components/HumanReadableNumberFormatter";
import { fade, useWithTheme, withClassNamePrefix } from "../../core";
import useConfiguration from "../../core/ConfigurationProvider/useConfiguration";
import useEntitiesCounts from "../../hooks/useEntitiesCounts";
import useTextTransform from "../../hooks/useTextTransform";
import labelsByEngine from "../../utils/labelsByEngine";
import defaultStyles from "./ConnectionDetail.styles";

export type VertexDetailProps = {
  classNamePrefix?: string;
};

const ConnectionData = ({ classNamePrefix = "ft" }: VertexDetailProps) => {
  const config = useConfiguration();
  const navigate = useNavigate();
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  const { totalNodes, totalEdges } = useEntitiesCounts();
  const textTransform = useTextTransform();
  const labels = labelsByEngine[config?.connection?.queryEngine || "gremlin"];

  const verticesByTypeItems = useMemo(() => {
    const items: AdvancedListItemType<any>[] = [];
    (config?.vertexTypes || []).forEach(vt => {
      const vtConfig = config?.getVertexTypeConfig(vt);
      const displayLabel = vtConfig?.displayLabel || vt;

      items.push({
        id: vt,
        title: displayLabel,
        titleComponent: (
          <div className={pfx("advanced-list-item-title")}>
            <div className={pfx("node-title")}>
              {textTransform(displayLabel)}
            </div>
            <div className={pfx("nodes-count")}>
              {labels["nodes"]}:{" "}
              {vtConfig?.total ? (
                <HumanReadableNumberFormatter value={vtConfig?.total} />
              ) : (
                "Unknown"
              )}
            </div>
          </div>
        ),
        icon: (
          <div
            style={{
              color: vtConfig?.color,
            }}
          >
            <VertexIcon
              iconUrl={vtConfig?.iconUrl}
              iconImageType={vtConfig?.iconImageType}
            />
          </div>
        ),
        className: css`
          .ft-start-adornment {
            color: ${vtConfig?.color}!important;
            background: ${fade(vtConfig?.color, 0.3)}!important;
          }
        `,
        endAdornment: (
          <IconButton
            tooltipText={`Explore ${textTransform(displayLabel)}`}
            icon={<ChevronRightIcon />}
            variant={"text"}
            size={"small"}
            onPress={() => navigate(`/data-explorer/${encodeURIComponent(vt)}`)}
          />
        ),
      });
    });

    return items;
  }, [config, pfx, textTransform, labels, navigate]);

  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
  }, [config?.id]);

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <div className={pfx("info-bar")}>
        <div className={pfx("item")}>
          <div className={pfx("tag")}>{labels["nodes"]}</div>
          <div className={pfx("value")}>
            <Chip className={pfx("value-chip")}>
              <GraphIcon />
              {totalNodes != null && (
                <HumanReadableNumberFormatter value={totalNodes} />
              )}
              {totalNodes == null && "Unknown"}
            </Chip>
          </div>
        </div>
        <div className={pfx("item")}>
          <div className={pfx("tag")}>{labels["edges"]}</div>
          <div className={pfx("value")}>
            <Chip className={pfx("value-chip")}>
              <EdgeIcon />
              {totalEdges != null && (
                <HumanReadableNumberFormatter value={totalEdges} />
              )}
              {totalEdges == null && "Unknown"}
            </Chip>
          </div>
        </div>
      </div>
      <AdvancedList
        searchPlaceholder={labels["search-placeholder"]}
        search={search}
        onSearch={setSearch}
        className={pfx("advanced-list")}
        items={verticesByTypeItems}
        emptyState={{
          noSearchResultsTitle: labels["conn-data-no-results-title"],
          noSearchResultsSubtitle: labels["conn-data-no-results-subtitle"],
          noElementsTitle: labels["conn-data-no-elements-title"],
          noElementsSubtitle: labels["conn-data-no-elements-subtitle"],
        }}
      />
    </div>
  );
};

export default ConnectionData;
