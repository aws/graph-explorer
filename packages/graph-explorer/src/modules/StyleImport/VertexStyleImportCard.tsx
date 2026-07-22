import { ArrowRightIcon } from "lucide-react";

import { VertexSymbol } from "@/components";

import type { VertexStyleImportItem } from "./styleImportPlan";

import {
  ImportCard,
  ImportCardProperties,
  ImportCardSurface,
  ImportCardTitle,
} from "./ImportCard";
import { PreviewLabel } from "./PreviewLabel";

/** A node style shown as a before and after card. */
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
      <ImportCardSurface className="grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-(--card-spacing)">
        <PreviewLabel>Before</PreviewLabel>
        <PreviewLabel className="col-start-3">After</PreviewLabel>
        <VertexSymbol vertexStyle={item.currentStyle} className="size-12" />
        <ArrowRightIcon className="text-primary-foreground/50 size-4 shrink-0" />
        <VertexSymbol vertexStyle={item.incomingStyle} className="size-12" />
      </ImportCardSurface>
      <ImportCardTitle>{item.type}</ImportCardTitle>
      <ImportCardProperties
        properties={[
          { label: "Display name", value: item.incoming.displayNameAttribute },
          {
            label: "Display description",
            value: item.incoming.longDisplayNameAttribute,
          },
          { label: "Display type", value: item.incoming.displayLabel },
        ]}
      />
    </ImportCard>
  );
}
