import { VertexSymbol } from "@/components";

import type { VertexStyleImportItem } from "./styleImportPlan";

import { BeforeAfterPreview } from "./BeforeAfterPreview";
import {
  ImportCard,
  ImportCardDetailItem,
  ImportCardDetails,
  ImportCardSurface,
  ImportCardTitle,
} from "./ImportCard";

/** A node style shown as a before→after card, with its label settings listed. */
export function VertexStyleImportCard({
  item,
  selected,
  onToggle,
}: {
  item: VertexStyleImportItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <ImportCard label={item.type} checked={selected} onCheckedChange={onToggle}>
      <ImportCardSurface>
        <BeforeAfterPreview
          beforeLabel={item.status === "conflict" ? "Current" : "Default"}
          afterLabel="Incoming"
          before={
            <VertexSymbol vertexStyle={item.currentStyle} className="size-12" />
          }
          after={
            <VertexSymbol
              vertexStyle={item.incomingStyle}
              className="size-12"
            />
          }
        />
      </ImportCardSurface>
      <ImportCardTitle>{item.type}</ImportCardTitle>
      <LabelSettings item={item} />
    </ImportCard>
  );
}

/**
 * The label-derived settings a node style carries. Only rows the incoming style
 * actually sets are rendered — an all-visual style shows no list.
 */
function LabelSettings({ item }: { item: VertexStyleImportItem }) {
  const rows = [
    { label: "Display name", value: item.incoming.displayNameAttribute },
    { label: "Description", value: item.incoming.longDisplayNameAttribute },
    { label: "Type override", value: item.incoming.displayLabel },
  ].filter(row => row.value !== undefined);

  if (rows.length === 0) {
    return null;
  }

  return (
    <ImportCardDetails>
      {rows.map(row => (
        <ImportCardDetailItem key={row.label} label={row.label}>
          {row.value}
        </ImportCardDetailItem>
      ))}
    </ImportCardDetails>
  );
}
