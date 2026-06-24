import { useState } from "react";

import type { DisplayAttribute, DisplayVertex } from "@/core";

import { Button, VertexRow } from "@/components";
import { EditIcon } from "@/components/icons";
import { useQueryEngine } from "@/core";
import useTranslations from "@/hooks/useTranslations";
import NeighborsList from "@/modules/common/NeighborsList/NeighborsList";
import {
  LABELS,
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";

import { EditVertexPropertiesDialog } from "./EditVertexPropertiesDialog";
import EntityAttribute from "./EntityAttribute";

export type VertexDetailProps = {
  node: DisplayVertex;
};

export default function NodeDetail({ node }: VertexDetailProps) {
  const t = useTranslations();
  const queryEngine = useQueryEngine();
  const [isEditOpen, setIsEditOpen] = useState(false);

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
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">{t("properties")}</div>
          {queryEngine === "gremlin" && (
            <Button
              variant="ghost"
              size="icon-small"
              tooltip="Edit properties"
              onClick={() => setIsEditOpen(true)}
            >
              <EditIcon />
            </Button>
          )}
        </div>
        <ul className="space-y-4.5">
          {allAttributes.map(attribute => (
            <EntityAttribute key={attribute.name} attribute={attribute} />
          ))}
        </ul>
      </div>
      {queryEngine === "gremlin" && (
        <EditVertexPropertiesDialog
          vertex={node}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </div>
  );
}
