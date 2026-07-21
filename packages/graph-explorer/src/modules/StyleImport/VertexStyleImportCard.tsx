import { CardContent, VertexSymbol } from "@/components";

import type { VertexStyleImportItem } from "./styleImportPlan";

import { BeforeAfterPreview } from "./BeforeAfterPreview";
import { StyleImportCardShell } from "./StyleImportCardShell";

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
    <StyleImportCardShell
      type={item.type}
      selected={selected}
      onToggle={onToggle}
      preview={
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
      }
    >
      <LabelSettings item={item} />
    </StyleImportCardShell>
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
    <CardContent>
      <dl className="text-muted-foreground space-y-3 border-t pt-4 text-sm">
        {rows.map(row => (
          <div
            key={row.label}
            className="flex flex-wrap justify-between gap-2 leading-snug"
          >
            <dt>{row.label}</dt>
            <dd className="gx-wrap-break-word text-foreground font-mono leading-snug">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </CardContent>
  );
}
