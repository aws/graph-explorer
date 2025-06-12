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
  ArrowStyle,
  DisplayAttribute,
  DisplayEdge,
  LineStyle,
  useDisplayVertex,
} from "@/core";
import EntityAttribute from "./EntityAttribute";
import {
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";
import { useTranslations } from "@/hooks";
import { IconBaseProps } from "@/components/icons/IconBase";
import { CSSProperties } from "react";

export type EdgeDetailProps = {
  edge: DisplayEdge;
};

const EdgeDetail = ({ edge }: EdgeDetailProps) => {
  const t = useTranslations();
  const sourceVertex = useDisplayVertex(edge.source.id);
  const targetVertex = useDisplayVertex(edge.target.id);

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
    <div className="divide-border divide-y">
      {/* Uses a grid with the first column width matching the size of the edge icon */}
      <div className="grid grid-cols-[2.75rem_1fr] gap-3 p-3">
        <EdgeRow
          edge={edge}
          source={sourceVertex}
          target={targetVertex}
          className="col-span-2"
        />
        <div
          className="row-span-2 flex flex-col items-center"
          style={{ color: style.lineColor || DEFAULT_LINE_COLOR }}
        >
          <Arrow
            kind={style.sourceArrowStyle || "none"}
            className="-mb-[1px] size-[24px] shrink-0 -rotate-90 transform"
          />
          <div
            className="h-full w-[2px]"
            style={styleForLineStyle(style.lineStyle || "solid")}
          ></div>
          <Arrow
            kind={style.targetArrowStyle || "triangle"}
            className="-mt-[1px] size-[24px] shrink-0 rotate-90 transform"
          />
        </div>
        <VertexRow vertex={sourceVertex} />
        <VertexRow vertex={targetVertex} />
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

const DEFAULT_LINE_COLOR = "#b3b3b3";

/** Maps the line style to the CSS properties for the line representation. */
function styleForLineStyle(style: LineStyle): CSSProperties {
  if (style === "solid") {
    return {
      background: "currentColor",
    };
  }

  if (style === "dashed") {
    return {
      backgroundImage:
        "linear-gradient(currentColor 70%, rgba(255, 255, 255, 0) 0%)",
      backgroundPosition: "right",
      backgroundSize: "2px 10px",
      backgroundRepeat: "repeat-y",
    };
  }

  if (style === "dotted") {
    return {
      backgroundImage:
        "linear-gradient(currentColor 50%, rgba(255, 255, 255, 0) 0%)",
      backgroundPosition: "right",
      backgroundSize: "2px 6px",
      backgroundRepeat: "repeat-y",
    };
  }

  return {};
}

/** Renders the right SVG icon for the given arrow style. */
function Arrow({ kind, ...props }: { kind: ArrowStyle } & IconBaseProps) {
  return (
    <>
      {kind === "triangle" && <ArrowTriangle {...props} />}
      {kind === "triangle-tee" && <ArrowTriangleTee {...props} />}
      {kind === "circle-triangle" && <ArrowTriangleCircle {...props} />}
      {kind === "triangle-cross" && <ArrowTriangleCross {...props} />}
      {kind === "triangle-backcurve" && <ArrowTriangleBackCurve {...props} />}
      {kind === "tee" && <ArrowTee {...props} />}
      {kind === "vee" && <ArrowVee {...props} />}
      {kind === "square" && <ArrowSquare {...props} />}
      {kind === "circle" && <ArrowCircle {...props} />}
      {kind === "diamond" && <ArrowDiamond {...props} />}
      {kind === "none" && <ArrowNone {...props} />}
    </>
  );
}

export default EdgeDetail;
