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
  EdgeRow,
  VertexRow,
} from "@/components";
import {
  DisplayAttribute,
  DisplayEdge,
  useDisplayVertex,
  useWithTheme,
} from "@/core";
import defaultStyles from "./EntityDetail.styles";
import EntityAttribute from "./EntityAttribute";
import {
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";
import { useTranslations } from "@/hooks";

export type EdgeDetailProps = {
  edge: DisplayEdge;
};

const EdgeDetail = ({ edge }: EdgeDetailProps) => {
  const t = useTranslations();
  const sourceVertex = useDisplayVertex(edge.source.id);
  const targetVertex = useDisplayVertex(edge.target.id);

  const styleWithTheme = useWithTheme();
  const style = edge.typeConfig.style;

  const allAttributes: DisplayAttribute[] = [
    ...(edge.hasUniqueId
      ? [
          {
            name: RESERVED_ID_PROPERTY,
            displayLabel: "Edge ID",
            displayValue: edge.displayId,
          },
        ]
      : []),
    {
      name: RESERVED_TYPES_PROPERTY,
      displayLabel: t("entities-tabular.edge-type"),
      displayValue: edge.displayTypes,
    },
    {
      name: "sourceVertex",
      displayLabel: t("entities-tabular.source-id"),
      displayValue: edge.source.displayId,
    },
    {
      name: "sourceVertexType",
      displayLabel: t("entities-tabular.source-type"),
      displayValue: edge.source.displayTypes,
    },
    {
      name: "targetVertex",
      displayLabel: t("entities-tabular.target-id"),
      displayValue: edge.target.displayId,
    },
    {
      name: "targetVertexType",
      displayLabel: t("entities-tabular.target-type"),
      displayValue: edge.target.displayTypes,
    },
    ...edge.attributes,
  ];

  return (
    <div className={styleWithTheme(defaultStyles(style.lineColor))}>
      <EdgeRow edge={edge} className="px-3 py-3" />
      <div className={cn("source-vertex")}>
        <div className={cn("start-line", `line-${style.lineStyle || "solid"}`)}>
          {style.sourceArrowStyle === "triangle" && (
            <ArrowTriangle className="source-arrow-type" />
          )}
          {style.sourceArrowStyle === "triangle-tee" && (
            <ArrowTriangleTee className="source-arrow-type" />
          )}
          {style.sourceArrowStyle === "circle-triangle" && (
            <ArrowTriangleCircle className="source-arrow-type" />
          )}
          {style.sourceArrowStyle === "triangle-cross" && (
            <ArrowTriangleCross className="source-arrow-type" />
          )}
          {style.sourceArrowStyle === "triangle-backcurve" && (
            <ArrowTriangleBackCurve className="source-arrow-type" />
          )}
          {style.sourceArrowStyle === "tee" && (
            <ArrowTee className="source-arrow-type" />
          )}
          {style.sourceArrowStyle === "vee" && (
            <ArrowVee className="source-arrow-type" />
          )}
          {style.sourceArrowStyle === "square" && (
            <ArrowSquare className="source-arrow-type" />
          )}
          {style.sourceArrowStyle === "circle" && (
            <ArrowCircle className="source-arrow-type" />
          )}
          {style.sourceArrowStyle === "diamond" && (
            <ArrowDiamond className="source-arrow-type" />
          )}
          {(style.sourceArrowStyle === "none" || !style.sourceArrowStyle) && (
            <ArrowNone className="source-arrow-type" />
          )}
        </div>
        <VertexRow vertex={sourceVertex} className="py-3" />
      </div>
      <div className={cn("target-vertex")}>
        <div className={cn("end-line", `line-${style.lineStyle || "solid"}`)}>
          {(style.targetArrowStyle === "triangle" ||
            !style.targetArrowStyle) && (
            <ArrowTriangle className="target-arrow-type" />
          )}
          {style.targetArrowStyle === "triangle-tee" && (
            <ArrowTriangleTee className="target-arrow-type" />
          )}
          {style.targetArrowStyle === "circle-triangle" && (
            <ArrowTriangleCircle className="target-arrow-type" />
          )}
          {style.targetArrowStyle === "triangle-cross" && (
            <ArrowTriangleCross className="target-arrow-type" />
          )}
          {style.targetArrowStyle === "triangle-backcurve" && (
            <ArrowTriangleBackCurve className="target-arrow-type" />
          )}
          {style.targetArrowStyle === "tee" && (
            <ArrowTee className="target-arrow-type" />
          )}
          {style.targetArrowStyle === "vee" && (
            <ArrowVee className="target-arrow-type" />
          )}
          {style.targetArrowStyle === "square" && (
            <ArrowSquare className="target-arrow-type" />
          )}
          {style.targetArrowStyle === "circle" && (
            <ArrowCircle className="target-arrow-type" />
          )}
          {style.targetArrowStyle === "diamond" && (
            <ArrowDiamond className="target-arrow-type" />
          )}
          {style.targetArrowStyle === "none" && (
            <ArrowNone className="target-arrow-type" />
          )}
        </div>
        <VertexRow vertex={targetVertex} className="py-3" />
      </div>
      <div className="space-y-[1.125rem] p-3">
        <div className="text-lg font-bold">Properties</div>
        <ul className="space-y-[1.125rem]">
          {allAttributes.map(attribute => (
            <EntityAttribute key={attribute.name} attribute={attribute} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EdgeDetail;
