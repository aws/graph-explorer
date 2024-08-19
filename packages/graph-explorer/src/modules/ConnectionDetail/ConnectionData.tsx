import { css, cx } from "@emotion/css";
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
} from "@/components";
import HumanReadableNumberFormatter from "@/components/HumanReadableNumberFormatter";
import { fade, useWithTheme } from "@/core";
import { useConfiguration } from "@/core/ConfigurationProvider";
import useEntitiesCounts from "@/hooks/useEntitiesCounts";
import useTextTransform from "@/hooks/useTextTransform";
import useTranslations from "@/hooks/useTranslations";
import defaultStyles from "./ConnectionDetail.styles";
import { useVertexTypeConfigs } from "@/core/ConfigurationProvider/useConfiguration";

const ConnectionData = () => {
  const config = useConfiguration();
  const vtConfigs = useVertexTypeConfigs();
  const navigate = useNavigate();
  const styleWithTheme = useWithTheme();
  const { totalNodes, totalEdges } = useEntitiesCounts();
  const textTransform = useTextTransform();
  const t = useTranslations();

  const verticesByTypeItems = useMemo(() => {
    const items: AdvancedListItemType<any>[] = [];
    vtConfigs.forEach(vtConfig => {
      const vt = vtConfig.type;
      const displayLabel = vtConfig.displayLabel || vt;

      items.push({
        id: vt,
        title: displayLabel,
        titleComponent: (
          <div className={"advanced-list-item-title"}>
            <div className={"node-title"}>{textTransform(displayLabel)}</div>
          </div>
        ),
        icon: (
          <div
            style={{
              color: vtConfig.color,
            }}
          >
            <VertexIcon
              iconUrl={vtConfig.iconUrl}
              iconImageType={vtConfig.iconImageType}
            />
          </div>
        ),
        className: css`
          .start-adornment {
            color: ${vtConfig.color}!important;
            background: ${fade(vtConfig.color, 0.3)}!important;
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
  }, [vtConfigs, textTransform, navigate]);

  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
  }, [config?.id]);

  return (
    <div className={cx(styleWithTheme(defaultStyles), "h-full")}>
      <div className={"info-bar"}>
        <div className={"item"}>
          <div className={"tag"}>{t("connection-detail.nodes")}</div>
          <div className={"value"}>
            <Chip className={"value-chip"}>
              <GraphIcon />
              {totalNodes != null && (
                <HumanReadableNumberFormatter value={totalNodes} />
              )}
              {totalNodes == null && "Unknown"}
            </Chip>
          </div>
        </div>
        <div className={"item"}>
          <div className={"tag"}>{t("connection-detail.edges")}</div>
          <div className={"value"}>
            <Chip className={"value-chip"}>
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
        className={"advanced-list"}
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
