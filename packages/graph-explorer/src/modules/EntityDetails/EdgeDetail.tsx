import { cn } from "@/utils";
import { clone } from "lodash";
import { useMemo } from "react";
import type { Edge, Vertex } from "@/types/entities";
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
  VertexRow,
} from "@/components";
import EdgeIcon from "@/components/icons/EdgeIcon";
import { useWithTheme } from "@/core";
import { useConfiguration } from "@/core/ConfigurationProvider";
import { useTextTransform } from "@/hooks";
import { formatDate } from "@/utils";
import defaultStyles from "./EntityDetail.styles";
import { useEdgeTypeConfig } from "@/core/ConfigurationProvider/useConfiguration";

export type EdgeDetailProps = {
  edge: Edge;
  sourceVertex: Vertex;
  targetVertex: Vertex;
};

const EdgeDetail = ({ edge, sourceVertex, targetVertex }: EdgeDetailProps) => {
  const config = useConfiguration();
  const styleWithTheme = useWithTheme();

  const edgeConfig = useEdgeTypeConfig(edge.type);

  const sortedAttributes = useMemo(() => {
    const attributes = clone(edgeConfig?.attributes);
    return (
      attributes?.sort((a, b) =>
        a.displayLabel.localeCompare(b.displayLabel)
      ) || []
    );
  }, [edgeConfig?.attributes]);

  const textTransform = useTextTransform();

  return (
    <div className={styleWithTheme(defaultStyles(edgeConfig?.lineColor))}>
      <div className={"header"}>
        <div className={"icon"}>
          <EdgeIcon />
        </div>
        <div className={"content"}>
          <div className={"title"}>{textTransform(edge.type)}</div>
          {config?.connection?.queryEngine !== "sparql" && <div>{edge.id}</div>}
        </div>
      </div>
      <div className={cn("header", "source-vertex")}>
        <div
          className={cn(
            "start-line",
            `line-${edgeConfig?.lineStyle || "solid"}`
          )}
        >
          {edgeConfig?.sourceArrowStyle === "triangle" && (
            <ArrowTriangle className={"source-arrow-type"} />
          )}
          {edgeConfig?.sourceArrowStyle === "triangle-tee" && (
            <ArrowTriangleTee className={"source-arrow-type"} />
          )}
          {edgeConfig?.sourceArrowStyle === "circle-triangle" && (
            <ArrowTriangleCircle className={"source-arrow-type"} />
          )}
          {edgeConfig?.sourceArrowStyle === "triangle-cross" && (
            <ArrowTriangleCross className={"source-arrow-type"} />
          )}
          {edgeConfig?.sourceArrowStyle === "triangle-backcurve" && (
            <ArrowTriangleBackCurve className={"source-arrow-type"} />
          )}
          {edgeConfig?.sourceArrowStyle === "tee" && (
            <ArrowTee className={"source-arrow-type"} />
          )}
          {edgeConfig?.sourceArrowStyle === "vee" && (
            <ArrowVee className={"source-arrow-type"} />
          )}
          {edgeConfig?.sourceArrowStyle === "square" && (
            <ArrowSquare className={"source-arrow-type"} />
          )}
          {edgeConfig?.sourceArrowStyle === "circle" && (
            <ArrowCircle className={"source-arrow-type"} />
          )}
          {edgeConfig?.sourceArrowStyle === "diamond" && (
            <ArrowDiamond className={"source-arrow-type"} />
          )}
          {(edgeConfig?.sourceArrowStyle === "none" ||
            !edgeConfig?.sourceArrowStyle) && (
            <ArrowNone className={"source-arrow-type"} />
          )}
        </div>
        <VertexRow vertex={sourceVertex} />
      </div>
      <div className={cn("header", "target-vertex")}>
        <div
          className={cn("end-line", `line-${edgeConfig?.lineStyle || "solid"}`)}
        >
          {(edgeConfig?.targetArrowStyle === "triangle" ||
            !edgeConfig?.targetArrowStyle) && (
            <ArrowTriangle className={"target-arrow-type"} />
          )}
          {edgeConfig?.targetArrowStyle === "triangle-tee" && (
            <ArrowTriangleTee className={"target-arrow-type"} />
          )}
          {edgeConfig?.targetArrowStyle === "circle-triangle" && (
            <ArrowTriangleCircle className={"target-arrow-type"} />
          )}
          {edgeConfig?.targetArrowStyle === "triangle-cross" && (
            <ArrowTriangleCross className={"target-arrow-type"} />
          )}
          {edgeConfig?.targetArrowStyle === "triangle-backcurve" && (
            <ArrowTriangleBackCurve className={"target-arrow-type"} />
          )}
          {edgeConfig?.targetArrowStyle === "tee" && (
            <ArrowTee className={"target-arrow-type"} />
          )}
          {edgeConfig?.targetArrowStyle === "vee" && (
            <ArrowVee className={"target-arrow-type"} />
          )}
          {edgeConfig?.targetArrowStyle === "square" && (
            <ArrowSquare className={"target-arrow-type"} />
          )}
          {edgeConfig?.targetArrowStyle === "circle" && (
            <ArrowCircle className={"target-arrow-type"} />
          )}
          {edgeConfig?.targetArrowStyle === "diamond" && (
            <ArrowDiamond className={"target-arrow-type"} />
          )}
          {edgeConfig?.targetArrowStyle === "none" && (
            <ArrowNone className={"target-arrow-type"} />
          )}
        </div>
        <VertexRow vertex={targetVertex} />
      </div>
      {edgeConfig && sortedAttributes.length > 0 && (
        <div className={"properties"}>
          <div className={"title"}>Properties</div>
          <div className={"content"}>
            {sortedAttributes.map(attribute => (
              <div key={attribute.name} className={"attribute"}>
                <div className={"attribute-name"}>{attribute.displayLabel}</div>
                {attribute.dataType !== "Date" && (
                  <div className={"attribute-value"}>
                    {edge.attributes[attribute.name] == null
                      ? "---"
                      : String(edge.attributes[attribute.name])}
                  </div>
                )}
                {attribute.dataType === "Date" && (
                  <div className={"attribute-value"}>
                    {formatDate(new Date(edge.attributes[attribute.name]))}
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
