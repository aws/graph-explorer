import type { ReactNode } from "react";

import { Card, CardHeader, CardTitle, Checkbox } from "@/components";
import { cn } from "@/utils";

/**
 * The chrome shared by the node and edge style cards: the selectable Card, the
 * canvas-backed preview region with its checkbox, the monospace type-name
 * header, and an optional detail area beneath it. The kind-specific cards
 * supply the `preview` (a {@link BeforeAfterPreview}) and any `children`
 * (e.g. a node's label settings, wrapped in their own `CardContent`);
 * everything else stays identical between them.
 *
 * The card fills the full height of its grid cell so a row of cards keeps a
 * consistent height regardless of how much detail each one carries.
 */
export function StyleImportCardShell({
  type,
  selected,
  onToggle,
  preview,
  children,
}: {
  type: string;
  selected: boolean;
  onToggle: () => void;
  preview: ReactNode;
  children?: ReactNode;
}) {
  return (
    <label className="block h-full cursor-pointer">
      <Card
        className={cn(
          "h-full pt-0 transition",
          selected ? "border-primary ring-primary ring-2" : "saturate-0",
        )}
      >
        <div className="bg-workspace-canvas relative px-[calc(var(--card-spacing)+(--spacing(4)))] py-(--card-spacing)">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            className="absolute top-(--card-spacing) left-(--card-spacing)"
            aria-label={`Load ${type} style`}
          />
          {preview}
        </div>
        <CardHeader>
          <CardTitle className="gx-wrap-break-word font-mono text-sm font-normal">
            {type}
          </CardTitle>
        </CardHeader>
        {children}
      </Card>
    </label>
  );
}
