import { EdgePreview } from "@/components";
import { formatStyleCondition } from "@/core/StateProvider/conditionalStyling";

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
  const isConditional = item.variant === "conditional";

  return (
    <ImportCard
      label={isConditional ? `${item.type} conditional` : item.type}
      checked={selected}
      onCheckedChange={onToggle}
    >
      <ImportCardSurface className="space-y-9">
        <div className="flex flex-col items-center gap-3">
          <PreviewLabel>{isConditional ? "Base" : "Before"}</PreviewLabel>
          <EdgePreview
            edgeStyle={item.currentStyle}
            label={item.currentStyle.displayLabel || item.type}
            className="zoom-75"
          />
        </div>
        <div className="flex flex-col items-center gap-3">
          <PreviewLabel>{isConditional ? "When met" : "After"}</PreviewLabel>
          <EdgePreview
            edgeStyle={item.incomingStyle}
            label={item.incomingStyle.displayLabel || item.type}
            className="zoom-75"
          />
        </div>
      </ImportCardSurface>
      <ImportCardTitle>
        {item.type}
        {isConditional ? (
          <span className="text-muted-foreground"> · conditional</span>
        ) : null}
      </ImportCardTitle>
      {isConditional ? (
        <ImportCardProperties
          properties={[
            { label: "Condition", value: formatStyleCondition(item.condition) },
          ]}
        />
      ) : (
        <ImportCardProperties
          properties={[
            {
              label: "Display name",
              value: item.incoming.displayNameAttribute,
            },
            { label: "Display type", value: item.incoming.displayLabel },
          ]}
        />
      )}
    </ImportCard>
  );
}
