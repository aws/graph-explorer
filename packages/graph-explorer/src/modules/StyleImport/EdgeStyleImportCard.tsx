import type { EdgeStyle } from "@/core";

import { EdgePreview } from "@/components";

import type { EdgeStyleImportItem } from "./styleImportPlan";

import { VerticalBeforeAfterPreview } from "./BeforeAfterPreview";
import { ImportCard, ImportCardSurface, ImportCardTitle } from "./ImportCard";

/**
 * An edge style shown as a before→after card, the same size as a node card. The
 * two edge previews stack vertically so the wide edge rendering fits the card.
 */
export function EdgeStyleImportCard({
  item,
  selected,
  onToggle,
}: {
  item: EdgeStyleImportItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <ImportCard label={item.type} checked={selected} onCheckedChange={onToggle}>
      <ImportCardSurface>
        <VerticalBeforeAfterPreview
          beforeLabel={item.status === "conflict" ? "Current" : "Default"}
          afterLabel="Incoming"
          before={<Preview edgeStyle={item.currentStyle} type={item.type} />}
          after={<Preview edgeStyle={item.incomingStyle} type={item.type} />}
        />
      </ImportCardSurface>
      <ImportCardTitle>{item.type}</ImportCardTitle>
    </ImportCard>
  );
}

/**
 * One side of the before→after. Falls back to the type name for the label when
 * the style sets no display-label override — the same text the canvas draws.
 */
function Preview({ edgeStyle, type }: { edgeStyle: EdgeStyle; type: string }) {
  return (
    <EdgePreview
      edgeStyle={edgeStyle}
      label={edgeStyle.displayLabel || type}
      className="zoom-75"
    />
  );
}
