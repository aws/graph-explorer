import { css } from "@emotion/css";
import { cn } from "@/utils";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AdvancedList,
  AdvancedListItemType,
  ChevronRightIcon,
  Chip,
  EdgeIcon,
  GraphIcon,
  IconButton,
  VertexIcon,
} from "@/components";
import HumanReadableNumberFormatter from "@/components/HumanReadableNumberFormatter";
import { fade, useDisplayVertexTypeConfigs, useWithTheme } from "@/core";
import { useConfiguration } from "@/core/ConfigurationProvider";
import useEntitiesCounts from "@/hooks/useEntitiesCounts";
import useTranslations from "@/hooks/useTranslations";
import defaultStyles from "./ConnectionDetail.styles";

const ConnectionData = () => {
  const config = useConfiguration();
  const vtConfigs = useDisplayVertexTypeConfigs();
  const navigate = useNavigate();
  const styleWithTheme = useWithTheme();
  const { totalNodes, totalEdges } = useEntitiesCounts();
  const t = useTranslations();

  const verticesByTypeItems = useMemo(() => {
    const items: AdvancedListItemType<any>[] = [];
    vtConfigs.forEach(vtConfig => {
      items.push({
        id: vtConfig.type,
        title: vtConfig.displayLabel,
        titleComponent: (
          <div className="advanced-list-item-title">
            <div className="node-title">{vtConfig.displayLabel}</div>
          </div>
        ),
        icon: <VertexIcon vertexStyle={vtConfig.style} />,
        className: css`
          .start-adornment {
            color: ${vtConfig.style.color}!important;
            background: ${fade(vtConfig.style.color, 0.3)}!important;
          }
        `,
        endAdornment: (
          <IconButton
            tooltipText={`Explore ${vtConfig.displayLabel}`}
            icon={<ChevronRightIcon />}
            variant="text"
            size="small"
            onClick={() =>
              navigate(`/data-explorer/${encodeURIComponent(vtConfig.type)}`)
            }
          />
        ),
      });
    });

    return items;
  }, [vtConfigs, navigate]);

  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
  }, [config?.id]);

  return (
    <div className={cn(styleWithTheme(defaultStyles), "flex grow flex-col")}>
      <div className="info-bar">
        <div className="item">
          <div className="tag">{t("connection-detail.nodes")}</div>
          <div className="value">
            <Chip className="value-chip">
              <GraphIcon />
              {totalNodes != null && (
                <HumanReadableNumberFormatter value={totalNodes} />
              )}
              {totalNodes == null && "Unknown"}
            </Chip>
          </div>
        </div>
        <div className="item">
          <div className="tag">{t("connection-detail.edges")}</div>
          <div className="value">
            <Chip className="value-chip">
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
        searchPlaceholder={t("connection-detail.search-placeholder")}
        search={search}
        onSearch={setSearch}
        className="advanced-list"
        items={verticesByTypeItems}
        emptyState={{
          noSearchResultsTitle: t("connection-detail.no-search-title"),
          noSearchResultsSubtitle: t("connection-detail.no-search-subtitle"),
          noElementsTitle: t("connection-detail.no-elements-title"),
          noElementsSubtitle: t("connection-detail.no-elements-subtitle"),
        }}
      />
    </div>
  );
};

export default ConnectionData;
