import type { ReactNode } from "react";

import { UploadIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components";
import {
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMedia,
  DialogTitle,
} from "@/components/Dialog";

import type { StyleImportItem, StyleImportPlan } from "./styleImportPlan";

import { EdgeStyleImportCard } from "./EdgeStyleImportCard";
import { VertexStyleImportCard } from "./VertexStyleImportCard";

/**
 * A stable per-item key that stays unique across the two type namespaces —
 * a vertex and an edge can share a raw type string, so the `kind` prefix keeps
 * their selection state distinct.
 */
function itemKey(item: StyleImportItem): string {
  return `${item.kind}:${item.type}`;
}

/**
 * The selective style load modal: every actionable style from the file as a
 * before→after card, all selected by default. Loading writes the checked
 * styles to the user styles layer via `onLoad` and dismisses.
 */
export function StyleImportModal({
  fileName,
  plan,
  onLoad,
  onClose,
}: {
  fileName: string;
  plan: StyleImportPlan;
  onLoad: (items: StyleImportItem[]) => void;
  onClose: () => void;
}) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(plan.items.map(itemKey)),
  );

  const selectedItems = plan.items.filter(item =>
    selectedKeys.has(itemKey(item)),
  );

  function toggle(item: StyleImportItem) {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      const key = itemKey(item);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const vertexItems = plan.items.filter(item => item.kind === "vertex");
  const edgeItems = plan.items.filter(item => item.kind === "edge");

  return (
    <DialogContent className="w-[min(64rem,calc(100vw-2rem))] max-w-none">
      <DialogHeader>
        <DialogMedia className="bg-primary-subtle text-primary-foreground">
          <UploadIcon />
        </DialogMedia>
        <DialogTitle className="gx-wrap-break-word">
          Load styles from <span className="font-mono">{fileName}</span>
        </DialogTitle>
        <DialogDescription>
          Each card shows the current style on the left and what it becomes on
          the right. Choose which to apply — this cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="@container border-t">
        <StyleGroupGrid heading="Node types" count={vertexItems.length}>
          {vertexItems.map(item => (
            <VertexStyleImportCard
              key={itemKey(item)}
              item={item}
              selected={selectedKeys.has(itemKey(item))}
              onToggle={() => toggle(item)}
            />
          ))}
        </StyleGroupGrid>
        <StyleGroupGrid heading="Edge types" count={edgeItems.length}>
          {edgeItems.map(item => (
            <EdgeStyleImportCard
              key={itemKey(item)}
              item={item}
              selected={selectedKeys.has(itemKey(item))}
              onToggle={() => toggle(item)}
            />
          ))}
        </StyleGroupGrid>
      </DialogBody>
      <DialogFooter className="items-center sm:justify-between">
        <FooterSummary
          selectedItems={selectedItems}
          totalCount={plan.items.length}
          skippedCount={plan.skippedCount}
        />
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={selectedItems.length === 0}
            onClick={() => onLoad(selectedItems)}
          >
            {`Load ${selectedItems.length} selected`}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

/**
 * A titled, responsive grid of cards for one entity kind. Renders nothing when
 * the kind has no items so an all-nodes or all-edges file shows just the one
 * section.
 */
function StyleGroupGrid({
  heading,
  count,
  children,
}: {
  heading: string;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {`${heading} · ${count}`}
      </h3>
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @2xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function FooterSummary({
  selectedItems,
  totalCount,
  skippedCount,
}: {
  selectedItems: StyleImportItem[];
  totalCount: number;
  skippedCount: number;
}) {
  const nodeCount = selectedItems.filter(item => item.kind === "vertex").length;
  const edgeCount = selectedItems.length - nodeCount;

  return (
    <div className="text-muted-foreground text-sm">
      <p>
        {`${selectedItems.length} of ${totalCount} selected · ${nodeCount} ${nodeCount === 1 ? "node" : "nodes"}, ${edgeCount} ${edgeCount === 1 ? "edge" : "edges"}`}
      </p>
      {skippedCount > 0 ? (
        <p>{`${skippedCount} ${skippedCount === 1 ? "style" : "styles"} already match and were skipped`}</p>
      ) : null}
    </div>
  );
}
