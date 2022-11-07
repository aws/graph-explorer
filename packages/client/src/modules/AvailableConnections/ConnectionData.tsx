import { css } from "@emotion/css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdvancedList,
  AdvancedListItemType,
  ChevronRightIcon,
  IconButton,
  VertexIcon,
} from "../../components";
import HumanReadableNumberFormatter from "../../components/HumanReadableNumberFormatter";
import { fade, useWithTheme, withClassNamePrefix } from "../../core";
import useConfiguration from "../../core/ConfigurationProvider/useConfiguration";
import defaultStyles from "./AvailableConnections.styles";

export type ConnectionDataProps = {
  classNamePrefix?: string;
};

const ConnectionData = ({ classNamePrefix = "ft" }: ConnectionDataProps) => {
  const config = useConfiguration();
  const navigate = useNavigate();
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const totalNodes = useMemo(() => {
    if (!config?.vertexTypes.length) {
      return null;
    }

    let total = 0;

    for (const vt of config.vertexTypes) {
      const currTotal = config?.getVertexTypeConfig(vt)?.total;
      if (currTotal == null) {
        return null;
      }

      total += currTotal;
    }

    return total;
  }, [config]);

  const totalEdges = useMemo(() => {
    if (!config?.edgeTypes.length) {
      return null;
    }

    let total = 0;

    for (const et of config.edgeTypes) {
      const currTotal = config?.getEdgeTypeConfig(et)?.total;
      if (currTotal == null) {
        return null;
      }

      total += currTotal;
    }

    return total;
  }, [config]);

  const verticesByTypeItems = useMemo(() => {
    const items: AdvancedListItemType<any>[] = [];
    (config?.vertexTypes || []).forEach(vt => {
      const vtConfig = config?.getVertexTypeConfig(vt);
      items.push({
        id: vt,
        title: vtConfig?.displayLabel || vt,
        titleComponent: (
          <div className={pfx("advanced-list-item-title")}>
            <div className={pfx("node-title")}>
              {vtConfig?.displayLabel || vt}
            </div>
            <div className={pfx("nodes-count")}>
              Resources:{" "}
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
            tooltipText={`Explore ${vtConfig?.displayLabel || vt}`}
            icon={<ChevronRightIcon />}
            variant={"text"}
            size={"small"}
            onPress={() => navigate(`/data-explorer/${encodeURIComponent(vt)}`)}
          />
        ),
      });
    });

    return items;
  }, [config, pfx, navigate]);

  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
  }, [config?.id]);

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <div className={pfx("info-bar")}>
        <div className={pfx("item")}>
          <div className={pfx("tag")}>Total Resources</div>
          <div className={pfx("value")}>
            {totalNodes != null && (
              <HumanReadableNumberFormatter value={totalNodes} />
            )}
            {totalNodes == null && "Unknown"}
          </div>
        </div>
        <div className={pfx("item")}>
          <div className={pfx("tag")}>Total Predicates</div>
          <div className={pfx("value")}>
            {totalEdges != null && (
              <HumanReadableNumberFormatter value={totalEdges} />
            )}
            {totalEdges == null && "Unknown"}
          </div>
        </div>
        <div className={pfx("item")}>
          <div className={pfx("tag")}>Total Prefixes</div>
          <div className={pfx("value")}>
            {totalEdges != null && (
              <HumanReadableNumberFormatter value={totalEdges} />
            )}
            {totalEdges == null && "Unknown"}
          </div>
        </div>
      </div>
      <AdvancedList
        searchPlaceholder={"Search for Class"}
        search={search}
        onSearch={setSearch}
        className={pfx("advanced-list")}
        items={verticesByTypeItems}
        emptyState={{
          noSearchResultsTitle: "No Classes",
          noSearchResultsSubtitle: "No Classes found with searched criteria",
          noElementsTitle: "No Resources",
          noElementsSubtitle: "No Resources found to be shown in this list",
        }}
      />
    </div>
  );
};

export default ConnectionData;
