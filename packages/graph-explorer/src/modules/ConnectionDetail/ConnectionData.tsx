import { css } from "@emotion/css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdvancedList,
  AdvancedListItemType,
  BridgeIcon,
  ChevronRightIcon,
  Chip,
  EdgeIcon,
  GraphIcon,
  IconButton,
  VertexIcon
} from "../../components";
import HumanReadableNumberFormatter from "../../components/HumanReadableNumberFormatter";
import { fade, useWithTheme, withClassNamePrefix } from "../../core";
import useConfiguration from "../../core/ConfigurationProvider/useConfiguration";
import useEntitiesCounts from "../../hooks/useEntitiesCounts";
import useTextTransform from "../../hooks/useTextTransform";
import useTranslations from "../../hooks/useTranslations";
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
  const t = useTranslations();

  const verticesByTypeItems = useMemo(() => {
    const items: AdvancedListItemType<any>[] = [];
    (config?.vertexTypes || []).forEach(vt => {
      const vtConfig = config?.getVertexTypeConfig(vt);
      const displayLabel = vtConfig?.displayLabel || vt;
      const vDetailCounts =  vtConfig?.total;

      items.push({
        id: vt,
        title: displayLabel,
        titleComponent: (
          <div className={pfx("advanced-list-item-title")}>
            <div className={pfx("node-title")}>
            {textTransform(displayLabel)}
            </div>
            <div className={pfx("node-count")} style={{color: "grey", fontStyle: 'italic'}}>
              {vDetailCounts?.toString()}
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
  }, [config, pfx, textTransform, navigate]);

  const edgesByTypeItems = useMemo(() => {
    const items: AdvancedListItemType<any>[] = [];
    (config?.edgeTypes || []).forEach(et => {
      const etConfig = config?.getEdgeTypeConfig(et);
      const displayLabel = etConfig?.displayLabel || et;
      const eDetailCounts =  etConfig?.total;

      items.push({
        id: et,
        title: displayLabel,
        titleComponent: (
          <div className={pfx("advanced-list-item-title")}>
            <div className={pfx("node-title")}>
            {textTransform(displayLabel)}
            </div>
            <div className={pfx("edge-count")} style={{color: "grey", fontStyle: 'italic'}}>
              {eDetailCounts?.toString()}
            </div>
          </div>
        ),
        icon: (
          <div
            style={{
              color: "#7b03fc"
            }}
          >
            <BridgeIcon
              iconUrl={etConfig?.iconUrl}
              iconImageType={etConfig?.iconImageType}
            />
          </div>
        ),
        className: css`
          .ft-start-adornment {
            color: ${"#7b03fc"}!important;
            background: ${fade("#7b03fc", 0.3)}!important;
          }
        `,
        endAdornment: (
          <IconButton
            tooltipText={`Explore ${textTransform(displayLabel)}`}
            icon={<ChevronRightIcon />}
            variant={"text"}
            size={"small"}
            onPress={() => navigate(`/data-explorer/${encodeURIComponent(et)}`)}
          />
        ),
      });
    });

    return items;
  }, [config, pfx, textTransform, navigate]);


////////////////////////////////////////////////////////////////

  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
  }, [config?.id]);

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <div className={pfx("info-bar")}>
        <div className={pfx("item")}>
          <div className={pfx("tag")}>{t("connection-detail.nodes")}</div>
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
          <div className={pfx("tag")}>{t("connection-detail.edges")}</div>
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
        searchPlaceholder={t("connection-detail.search-placeholder")}
        search={search}
        onSearch={setSearch}
        className={pfx("advanced-list")}
        items={verticesByTypeItems.concat(edgesByTypeItems.sort())}
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
