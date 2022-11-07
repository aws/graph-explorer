import { cx } from "@emotion/css";
import { clone } from "lodash";
import { useMemo } from "react";
import type { Edge, Vertex } from "../../@types/entities";
import { VertexIcon } from "../../components";
import EdgeIcon from "../../components/icons/EdgeIcon";
import { useWithTheme, withClassNamePrefix } from "../../core";
import useConfiguration from "../../core/ConfigurationProvider/useConfiguration";
import fade from "../../core/ThemeProvider/utils/fade";
import useDisplayNames from "../../hooks/useDisplayNames";
import useTextTransform from "../../hooks/useTextTransform";
import formatDate from "../../utils/formatDate";
import defaultStyles from "./EntityDetail.styles";

export type EdgeDetailProps = {
  classNamePrefix?: string;
  edge: Edge;
  sourceVertex: Vertex;
  targetVertex: Vertex;
};

const EdgeDetail = ({
  classNamePrefix = "ft",
  edge,
  sourceVertex,
  targetVertex,
}: EdgeDetailProps) => {
  const config = useConfiguration();
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const edgeConfig = useMemo(() => {
    return config?.getEdgeTypeConfig(edge.data.__e_type);
  }, [config, edge.data.__e_type]);

  const sourceVertexConfig = useMemo(() => {
    if (!sourceVertex) {
      return;
    }
    return config?.getVertexTypeConfig(sourceVertex?.data.__v_type);
  }, [config, sourceVertex]);

  const targetVertexConfig = useMemo(() => {
    if (!targetVertex) {
      return;
    }
    return config?.getVertexTypeConfig(targetVertex?.data.__v_type);
  }, [config, targetVertex]);

  const sortedAttributes = useMemo(() => {
    const attributes = clone(edgeConfig?.attributes);
    return (
      attributes?.sort((a, b) =>
        a.displayLabel.localeCompare(b.displayLabel)
      ) || []
    );
  }, [edgeConfig?.attributes]);

  const textTransform = useTextTransform();
  const getDisplayNames = useDisplayNames();
  const { name: sourceName } = getDisplayNames(sourceVertex);
  const { name: targetName } = getDisplayNames(targetVertex);

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <div className={pfx("header")}>
        <div className={pfx("icon")}>
          <EdgeIcon />
        </div>
        <div className={pfx("content")}>
          <div className={pfx("title")}>
            {textTransform(edge.data.__e_type)}
          </div>
          {config?.connection?.queryEngine !== "sparql" && (
            <div>{edge.data.id}</div>
          )}
        </div>
      </div>
      <div className={cx(pfx("header"), pfx("source-vertex"))}>
        <div className={pfx("start-line")} />
        {sourceVertexConfig?.iconUrl && (
          <div
            className={pfx("icon")}
            style={{
              background: fade(sourceVertexConfig.color, 0.2),
              color: sourceVertexConfig.color,
            }}
          >
            <VertexIcon
              iconUrl={sourceVertexConfig?.iconUrl}
              iconImageType={sourceVertexConfig?.iconImageType}
            />
          </div>
        )}
        <div className={pfx("content")}>
          <div className={pfx("title")}>{sourceName}</div>
          <div>
            {textTransform(
              sourceVertex?.data.__v_type || sourceVertex?.data.id
            )}
          </div>
        </div>
      </div>
      <div className={cx(pfx("header"), pfx("target-vertex"))}>
        <div className={pfx("end-line")} />
        {targetVertexConfig?.iconUrl && (
          <div
            className={pfx("icon")}
            style={{
              background: fade(targetVertexConfig.color, 0.2),
              color: targetVertexConfig.color,
            }}
          >
            <VertexIcon
              iconUrl={targetVertexConfig?.iconUrl}
              iconImageType={targetVertexConfig?.iconImageType}
            />
          </div>
        )}
        <div className={pfx("content")}>
          <div className={pfx("title")}>{targetName}</div>
          <div>
            {textTransform(
              targetVertex?.data.__v_type || targetVertex?.data.id
            )}
          </div>
        </div>
      </div>
      {edgeConfig && sortedAttributes.length > 0 && (
        <div className={pfx("properties")}>
          <div className={pfx("title")}>Properties</div>
          <div className={pfx("content")}>
            {sortedAttributes.map(attribute => (
              <div key={attribute.name} className={pfx("attribute")}>
                <div className={pfx("attribute-name")}>
                  {attribute.displayLabel}
                </div>
                {attribute.dataType !== "Date" && (
                  <div className={pfx("attribute-value")}>
                    {edge.data.attributes[attribute.name] == null
                      ? "---"
                      : String(edge.data.attributes[attribute.name])}
                  </div>
                )}
                {attribute.dataType === "Date" && (
                  <div className={pfx("attribute-value")}>
                    {formatDate(new Date(edge.data.attributes[attribute.name]))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EdgeDetail;
