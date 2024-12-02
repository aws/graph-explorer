import { cn } from "@/utils";
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
import { DisplayEdge, useDisplayVertex, useWithTheme } from "@/core";
import defaultStyles from "./EntityDetail.styles";
import EntityAttribute from "./EntityAttribute";

export type EdgeDetailProps = {
  edge: DisplayEdge;
};

const EdgeDetail = ({ edge }: EdgeDetailProps) => {
  const sourceVertex = useDisplayVertex(edge.source.id);
  const targetVertex = useDisplayVertex(edge.target.id);

  const styleWithTheme = useWithTheme();
  const style = edge.typeConfig.style;

  return (
    <div className={styleWithTheme(defaultStyles(style.lineColor))}>
      <div className={"header"}>
        <div className={"icon"}>
          <EdgeIcon />
        </div>
        <div className={"content"}>
          <div className={"title"}>{edge.displayTypes}</div>
          {edge.displayId && <div>{edge.displayId}</div>}
        </div>
      </div>
      <div className={cn("header", "source-vertex")}>
        <div className={cn("start-line", `line-${style.lineStyle || "solid"}`)}>
          {style.sourceArrowStyle === "triangle" && (
            <ArrowTriangle className={"source-arrow-type"} />
          )}
          {style.sourceArrowStyle === "triangle-tee" && (
            <ArrowTriangleTee className={"source-arrow-type"} />
          )}
          {style.sourceArrowStyle === "circle-triangle" && (
            <ArrowTriangleCircle className={"source-arrow-type"} />
          )}
          {style.sourceArrowStyle === "triangle-cross" && (
            <ArrowTriangleCross className={"source-arrow-type"} />
          )}
          {style.sourceArrowStyle === "triangle-backcurve" && (
            <ArrowTriangleBackCurve className={"source-arrow-type"} />
          )}
          {style.sourceArrowStyle === "tee" && (
            <ArrowTee className={"source-arrow-type"} />
          )}
          {style.sourceArrowStyle === "vee" && (
            <ArrowVee className={"source-arrow-type"} />
          )}
          {style.sourceArrowStyle === "square" && (
            <ArrowSquare className={"source-arrow-type"} />
          )}
          {style.sourceArrowStyle === "circle" && (
            <ArrowCircle className={"source-arrow-type"} />
          )}
          {style.sourceArrowStyle === "diamond" && (
            <ArrowDiamond className={"source-arrow-type"} />
          )}
          {(style.sourceArrowStyle === "none" || !style.sourceArrowStyle) && (
            <ArrowNone className={"source-arrow-type"} />
          )}
        </div>
        <VertexRow vertex={sourceVertex} />
      </div>
      <div className={cn("header", "target-vertex")}>
        <div className={cn("end-line", `line-${style.lineStyle || "solid"}`)}>
          {(style.targetArrowStyle === "triangle" ||
            !style.targetArrowStyle) && (
            <ArrowTriangle className={"target-arrow-type"} />
          )}
          {style.targetArrowStyle === "triangle-tee" && (
            <ArrowTriangleTee className={"target-arrow-type"} />
          )}
          {style.targetArrowStyle === "circle-triangle" && (
            <ArrowTriangleCircle className={"target-arrow-type"} />
          )}
          {style.targetArrowStyle === "triangle-cross" && (
            <ArrowTriangleCross className={"target-arrow-type"} />
          )}
          {style.targetArrowStyle === "triangle-backcurve" && (
            <ArrowTriangleBackCurve className={"target-arrow-type"} />
          )}
          {style.targetArrowStyle === "tee" && (
            <ArrowTee className={"target-arrow-type"} />
          )}
          {style.targetArrowStyle === "vee" && (
            <ArrowVee className={"target-arrow-type"} />
          )}
          {style.targetArrowStyle === "square" && (
            <ArrowSquare className={"target-arrow-type"} />
          )}
          {style.targetArrowStyle === "circle" && (
            <ArrowCircle className={"target-arrow-type"} />
          )}
          {style.targetArrowStyle === "diamond" && (
            <ArrowDiamond className={"target-arrow-type"} />
          )}
          {style.targetArrowStyle === "none" && (
            <ArrowNone className={"target-arrow-type"} />
          )}
        </div>
        <VertexRow vertex={targetVertex} />
      </div>
      {edge.attributes.length > 0 && (
        <div className={"properties"}>
          <div className={"title"}>Properties</div>
          <div className={"content"}>
            {edge.attributes.map(attribute => (
              <EntityAttribute key={attribute.name} attribute={attribute} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EdgeDetail;
