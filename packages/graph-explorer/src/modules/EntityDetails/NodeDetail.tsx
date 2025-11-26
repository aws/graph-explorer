import type { DisplayAttribute, DisplayVertex } from "@/core";
import useTranslations from "@/hooks/useTranslations";
import NeighborsList from "@/modules/common/NeighborsList/NeighborsList";
import EntityAttribute from "./EntityAttribute";
import {
  LABELS,
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";
import { VertexRow } from "@/components";

export type VertexDetailProps = {
  node: DisplayVertex;
};

export default function NodeDetail({ node }: VertexDetailProps) {
  const t = useTranslations();

  const displayTypes =
    node.displayTypes !== LABELS.MISSING_TYPE
      ? [
          {
            name: RESERVED_TYPES_PROPERTY,
            displayLabel: t("node-type"),
            displayValue: node.displayTypes,
          },
        ]
      : [];

  const allAttributes: DisplayAttribute[] = [
    {
      name: RESERVED_ID_PROPERTY,
      // Blank node IDs are not standard IDs, so they get a custom label
      displayLabel: node.isBlankNode ? LABELS.BLANK_NODE_ID : t("node-id"),
      displayValue: node.displayId,
    },
    ...displayTypes,
    ...node.attributes,
  ];

  return (
    <div>
      <VertexRow vertex={node} className="border-b p-3" />
      <NeighborsList vertexId={node.id} />
      <div className="space-y-4.5 p-3">
        <div className="text-lg font-bold">{t("properties")}</div>
        <ul className="space-y-4.5">
          {allAttributes.map(attribute => (
            <EntityAttribute key={attribute.name} attribute={attribute} />
          ))}
        </ul>
      </div>
    </div>
  );
}
