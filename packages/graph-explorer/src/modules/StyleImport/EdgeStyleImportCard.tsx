import { ArrowDownIcon } from "lucide-react";

import { EdgePreview } from "@/components";

import type { EdgeStyleImportItem } from "./styleImportPlan";

import {
  ImportCard,
  ImportCardProperties,
  ImportCardSurface,
  ImportCardTitle,
} from "./ImportCard";
import { PreviewLabel } from "./PreviewLabel";

/**
 * An edge style shown as a before and after card, the same size as a node card.
 * The two edge previews stack vertically so the wide edge rendering fits. Each
 * preview falls back to the type name when the style sets no display-label
 * override, the same text the canvas draws.
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
      <ImportCardSurface className="flex flex-col items-center gap-(--card-spacing)">
        <PreviewLabel>
          {item.status === "existing" ? "Current" : "Default"}
        </PreviewLabel>
        <EdgePreview
          edgeStyle={item.currentStyle}
          label={item.currentStyle.displayLabel || item.type}
          className="zoom-75"
        />
        <ArrowDownIcon className="text-primary-foreground/50 size-4 shrink-0" />
        <PreviewLabel>Incoming</PreviewLabel>
        <EdgePreview
          edgeStyle={item.incomingStyle}
          label={item.incomingStyle.displayLabel || item.type}
          className="zoom-75"
        />
      </ImportCardSurface>
      <ImportCardTitle>{item.type}</ImportCardTitle>
      <ImportCardProperties
        properties={[
          { label: "Display name", value: item.incoming.displayNameAttribute },
          { label: "Display type", value: item.incoming.displayLabel },
        ]}
      />
    </ImportCard>
  );
}
