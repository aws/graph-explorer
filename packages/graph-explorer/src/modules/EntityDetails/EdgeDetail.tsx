import type { CSSProperties } from "react";

import { ArrowStyleIcon, EdgeRow, VertexRow } from "@/components";
import {
  type DisplayAttribute,
  type DisplayEdge,
  type LineStyle,
  useDisplayVertex,
  useEdgeStyle,
} from "@/core";
import { useTranslations } from "@/hooks";
import {
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";

import EntityAttribute from "./EntityAttribute";

export type EdgeDetailProps = {
  edge: DisplayEdge;
};

const EdgeDetail = ({ edge }: EdgeDetailProps) => {
  const t = useTranslations();
  const sourceVertex = useDisplayVertex(edge.sourceId);
  const targetVertex = useDisplayVertex(edge.targetId);

  const style = useEdgeStyle(edge.type);

  const allAttributes: DisplayAttribute[] = [
    ...(edge.hasUniqueId
      ? [
          {
            name: RESERVED_ID_PROPERTY,
            displayLabel: t("edge-id"),
            displayValue: edge.displayId,
          },
        ]
      : []),
    {
      name: RESERVED_TYPES_PROPERTY,
      displayLabel: t("edge-type"),
      displayValue: edge.displayTypes,
    },
    {
      name: "sourceVertex",
      displayLabel: t("source-id"),
      displayValue: sourceVertex.displayId,
    },
    {
      name: "sourceVertexType",
      displayLabel: t("source-type"),
      displayValue: sourceVertex.displayTypes,
    },
    {
      name: "targetVertex",
      displayLabel: t("target-id"),
      displayValue: targetVertex.displayId,
    },
    {
      name: "targetVertexType",
      displayLabel: t("target-type"),
      displayValue: targetVertex.displayTypes,
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
          <ArrowStyleIcon
            arrowStyle={style.sourceArrowStyle || "none"}
            className="-mb-px size-[24px] shrink-0 -rotate-90 transform"
          />
          <div
            className="h-full w-[2px]"
            style={styleForLineStyle(style.lineStyle || "solid")}
          ></div>
          <ArrowStyleIcon
            arrowStyle={style.targetArrowStyle || "triangle"}
            className="-mt-px size-[24px] shrink-0 rotate-90 transform"
          />
        </div>
        <VertexRow vertex={sourceVertex} />
        <VertexRow vertex={targetVertex} />
      </div>
      <div className="space-y-4.5 p-3">
        <div className="text-lg font-semibold">{t("properties")}</div>
        <ul className="space-y-4.5">
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

export default EdgeDetail;
