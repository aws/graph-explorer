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
 * An edge style shown as a before and after card. The previews stack
 * vertically so the wide edge rendering fits the node-card width.
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
      <ImportCardSurface className="space-y-9">
        <div className="flex flex-col items-center gap-3">
          <PreviewLabel>Before</PreviewLabel>
          <EdgePreview edgeStyle={item.currentStyle} className="zoom-75" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <PreviewLabel>After</PreviewLabel>
          <EdgePreview edgeStyle={item.incomingStyle} className="zoom-75" />
        </div>
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
