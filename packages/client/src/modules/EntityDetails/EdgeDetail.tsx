import { cx } from "@emotion/css";
import { clone } from "lodash";
import { useMemo } from "react";
import type { Edge, Vertex } from "../../@types/entities";
import {
  ArrowCircle,
  ArrowDiamond,
  ArrowNone,
  ArrowSquare,
  ArrowTee,
  ArrowTriangle,
  ArrowTriangleBackCurve,
  ArrowTriangleCircle,
  ArrowTriangleCross,
  ArrowTriangleTee,
  ArrowVee,
  VertexIcon,
} from "../../components";
import EdgeIcon from "../../components/icons/EdgeIcon";
import { useWithTheme, withClassNamePrefix } from "../../core";
import useConfiguration from "../../core/ConfigurationProvider/useConfiguration";
import fade from "../../core/ThemeProvider/utils/fade";
import useDisplayNames from "../../hooks/useDisplayNames";
import useTextTransform from "../../hooks/useTextTransform";
import { formatDate } from "../../utils";
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
    return config?.getEdgeTypeConfig(edge.data.type);
  }, [config, edge.data.type]);

  const sourceVertexConfig = useMemo(() => {
    if (!sourceVertex) {
      return;
    }
    return config?.getVertexTypeConfig(sourceVertex?.data.type);
  }, [config, sourceVertex]);

  const targetVertexConfig = useMemo(() => {
    if (!targetVertex) {
      return;
    }
    return config?.getVertexTypeConfig(targetVertex?.data.type);
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
    <div
      className={styleWithTheme(
        defaultStyles(classNamePrefix, edgeConfig?.lineColor)
      )}
    >
      <div className={pfx("header")}>
        <div className={pfx("icon")}>
          <EdgeIcon />
        </div>
        <div className={pfx("content")}>
          <div className={pfx("title")}>{textTransform(edge.data.type)}</div>
          {config?.connection?.queryEngine !== "sparql" && (
            <div>{edge.data.id}</div>
          )}
        </div>
      </div>
      <div className={cx(pfx("header"), pfx("source-vertex"))}>
        <div
          className={cx(
            pfx("start-line"),
            pfx(`line-${edgeConfig?.lineStyle || "solid"}`)
          )}
        >
          {edgeConfig?.sourceArrowStyle === "triangle" && (
            <ArrowTriangle className={pfx("source-arrow-type")} />
          )}
          {edgeConfig?.sourceArrowStyle === "triangle-tee" && (
            <ArrowTriangleTee className={pfx("source-arrow-type")} />
          )}
          {edgeConfig?.sourceArrowStyle === "circle-triangle" && (
            <ArrowTriangleCircle className={pfx("source-arrow-type")} />
          )}
          {edgeConfig?.sourceArrowStyle === "triangle-cross" && (
            <ArrowTriangleCross className={pfx("source-arrow-type")} />
          )}
          {edgeConfig?.sourceArrowStyle === "triangle-backcurve" && (
            <ArrowTriangleBackCurve className={pfx("source-arrow-type")} />
          )}
          {edgeConfig?.sourceArrowStyle === "tee" && (
            <ArrowTee className={pfx("source-arrow-type")} />
          )}
          {edgeConfig?.sourceArrowStyle === "vee" && (
            <ArrowVee className={pfx("source-arrow-type")} />
          )}
          {edgeConfig?.sourceArrowStyle === "square" && (
            <ArrowSquare className={pfx("source-arrow-type")} />
          )}
          {edgeConfig?.sourceArrowStyle === "circle" && (
            <ArrowCircle className={pfx("source-arrow-type")} />
          )}
          {edgeConfig?.sourceArrowStyle === "diamond" && (
            <ArrowDiamond className={pfx("source-arrow-type")} />
          )}
          {(edgeConfig?.sourceArrowStyle === "none" ||
            !edgeConfig?.sourceArrowStyle) && (
            <ArrowNone className={pfx("source-arrow-type")} />
          )}
        </div>
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
            {textTransform(sourceVertex?.data.type || sourceVertex?.data.id)}
          </div>
        </div>
      </div>
      <div className={cx(pfx("header"), pfx("target-vertex"))}>
        <div
          className={cx(
            pfx("end-line"),
            pfx(`line-${edgeConfig?.lineStyle || "solid"}`)
          )}
        >
          {(edgeConfig?.targetArrowStyle === "triangle" ||
            !edgeConfig?.targetArrowStyle) && (
            <ArrowTriangle className={pfx("target-arrow-type")} />
          )}
          {edgeConfig?.targetArrowStyle === "triangle-tee" && (
            <ArrowTriangleTee className={pfx("target-arrow-type")} />
          )}
          {edgeConfig?.targetArrowStyle === "circle-triangle" && (
            <ArrowTriangleCircle className={pfx("target-arrow-type")} />
          )}
          {edgeConfig?.targetArrowStyle === "triangle-cross" && (
            <ArrowTriangleCross className={pfx("target-arrow-type")} />
          )}
          {edgeConfig?.targetArrowStyle === "triangle-backcurve" && (
            <ArrowTriangleBackCurve className={pfx("target-arrow-type")} />
          )}
          {edgeConfig?.targetArrowStyle === "tee" && (
            <ArrowTee className={pfx("target-arrow-type")} />
          )}
          {edgeConfig?.targetArrowStyle === "vee" && (
            <ArrowVee className={pfx("target-arrow-type")} />
          )}
          {edgeConfig?.targetArrowStyle === "square" && (
            <ArrowSquare className={pfx("target-arrow-type")} />
          )}
          {edgeConfig?.targetArrowStyle === "circle" && (
            <ArrowCircle className={pfx("target-arrow-type")} />
          )}
          {edgeConfig?.targetArrowStyle === "diamond" && (
            <ArrowDiamond className={pfx("target-arrow-type")} />
          )}
          {edgeConfig?.targetArrowStyle === "none" && (
            <ArrowNone className={pfx("target-arrow-type")} />
          )}
        </div>
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
            {textTransform(targetVertex?.data.type || targetVertex?.data.id)}
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
