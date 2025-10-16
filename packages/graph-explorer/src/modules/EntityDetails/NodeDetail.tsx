import { DisplayAttribute, DisplayVertex } from "@/core";
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

  const allAttributes: DisplayAttribute[] = [
    {
      name: RESERVED_ID_PROPERTY,
      // Blank node IDs are not standard IDs, so they get a custom label
      displayLabel: node.isBlankNode
        ? LABELS.BLANK_NODE_ID
        : t("node-detail.node-id"),
      displayValue: node.displayId,
    },
    {
      name: RESERVED_TYPES_PROPERTY,
      displayLabel: t("node-detail.node-type"),
      displayValue: node.displayTypes,
    },
    ...node.attributes,
  ];

  return (
    <div>
      <VertexRow vertex={node} className="border-b p-3" />
      <NeighborsList vertexId={node.id} />
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
}
