import type { ReactNode } from "react";

import { SearchXIcon, UploadIcon } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Checkbox,
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  ToggleGroup,
  ToggleGroupItem,
} from "@/components";
import {
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMedia,
  DialogTitle,
} from "@/components/Dialog";
import SearchBar from "@/components/SearchBar";

import type { StyleImportItem, StyleImportPlan } from "./styleImportPlan";
import type { SelectAllState, StyleImportFilter } from "./styleImportView";

import { EdgeStyleImportCard } from "./EdgeStyleImportCard";
import {
  filterCounts,
  selectAllState,
  selectVisibleItems,
} from "./styleImportView";
import { VertexStyleImportCard } from "./VertexStyleImportCard";

/**
 * A stable per-item key that stays unique across the two type namespaces —
 * a vertex and an edge can share a raw type string, so the `kind` prefix keeps
 * their selection state distinct.
 */
function itemKey(item: StyleImportItem): string {
  return `${item.kind}:${item.type}`;
}

const filterLabels: Record<StyleImportFilter, string> = {
  all: "All",
  nodes: "Nodes",
  edges: "Edges",
  new: "New",
  existing: "Existing",
};

/** Maps the three-state Select-All to Radix's `checked` value. */
const selectAllCheckedState: Record<SelectAllState, boolean | "indeterminate"> =
  {
    checked: true,
    unchecked: false,
    indeterminate: "indeterminate",
  };

/**
 * The selective style load modal: every actionable style from the file as a
 * before→after card, all selected by default. A filter tab, search box, and
 * Select-All narrow what is shown; selection stays the source of truth, so the
 * footer and Load button count every checked item regardless of the view.
 * Loading writes the checked styles to the user styles layer via `onLoad`.
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
  const [filter, setFilter] = useState<StyleImportFilter>("all");
  const [search, setSearch] = useState("");

  const isSelected = (item: StyleImportItem) => selectedKeys.has(itemKey(item));

  const selectedItems = plan.items.filter(isSelected);
  const visibleItems = selectVisibleItems(plan.items, filter, search);
  const counts = filterCounts(plan.items, search);

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

  function toggleVisible(select: boolean) {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      for (const item of visibleItems) {
        if (select) {
          next.add(itemKey(item));
        } else {
          next.delete(itemKey(item));
        }
      }
      return next;
    });
  }

  const visibleVertexItems = visibleItems.filter(
    item => item.kind === "vertex",
  );
  const visibleEdgeItems = visibleItems.filter(item => item.kind === "edge");
  const selectAll = selectAllState(visibleItems, isSelected);

  return (
    <DialogContent className="h-[52rem] w-[min(64rem,calc(100vw-2rem))] max-w-none">
      <DialogHeader className="pb-6">
        <DialogMedia className="bg-primary-subtle text-primary-foreground">
          <UploadIcon />
        </DialogMedia>
        <DialogTitle className="gx-wrap-break-word">
          Load styles from <span className="font-mono">{fileName}</span>
        </DialogTitle>
        <DialogDescription>
          Each card shows the current style and the incoming style. Choose which
          ones you want to import. This cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3 border-t px-6 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label
            htmlFor="style-import-select-all"
            className="flex w-fit shrink-0 cursor-pointer items-center gap-2 text-sm"
          >
            <Checkbox
              id="style-import-select-all"
              checked={selectAllCheckedState[selectAll]}
              disabled={visibleItems.length === 0}
              onCheckedChange={checked => toggleVisible(checked === true)}
            />
            Select all
          </label>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            className="sm:ml-auto"
            value={filter}
            onValueChange={value => {
              if (value in filterLabels) {
                setFilter(value as StyleImportFilter);
              }
            }}
          >
            {(Object.keys(filterLabels) as StyleImportFilter[]).map(key => (
              <ToggleGroupItem key={key} value={key}>
                {`${filterLabels[key]} ${counts[key]}`}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <SearchBar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search by type name"
            className="sm:max-w-xs"
          />
        </div>
      </div>
      <DialogBody className="@container gap-8 border-t pt-3">
        {visibleItems.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon variant="subtle">
              <SearchXIcon />
            </EmptyStateIcon>
            <EmptyStateContent>
              <EmptyStateTitle>No matching types</EmptyStateTitle>
              <EmptyStateDescription>
                Your filters matched 0 items. Try removing some filters.
              </EmptyStateDescription>
            </EmptyStateContent>
          </EmptyState>
        ) : (
          <>
            <StyleGroupGrid
              heading="Node types"
              count={visibleVertexItems.length}
            >
              {visibleVertexItems.map(item => (
                <VertexStyleImportCard
                  key={itemKey(item)}
                  item={item}
                  selected={isSelected(item)}
                  onToggle={() => toggle(item)}
                />
              ))}
            </StyleGroupGrid>
            <StyleGroupGrid
              heading="Edge types"
              count={visibleEdgeItems.length}
            >
              {visibleEdgeItems.map(item => (
                <EdgeStyleImportCard
                  key={itemKey(item)}
                  item={item}
                  selected={isSelected(item)}
                  onToggle={() => toggle(item)}
                />
              ))}
            </StyleGroupGrid>
          </>
        )}
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
 * the kind has no visible items, so a group disappears under a filter or search
 * that excludes it.
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
    <section className="space-y-4">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {`${heading} · ${count}`}
      </h3>
      <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @2xl:grid-cols-3">
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
    <div className="text-muted-foreground space-y-0.5 text-base">
      <p>
        <span className="text-foreground font-medium">
          {selectedItems.length}
        </span>
        <span> of </span>
        <span className="text-foreground font-medium">{totalCount}</span>
        <span> selected · </span>
        <span>{`${nodeCount} ${nodeCount === 1 ? "node" : "nodes"}, ${edgeCount} ${edgeCount === 1 ? "edge" : "edges"}`}</span>
      </p>
      {skippedCount > 0 ? (
        <p className="text-sm">{`${skippedCount} ${skippedCount === 1 ? "style" : "styles"} already matched and ${skippedCount === 1 ? "was" : "were"} skipped`}</p>
      ) : null}
    </div>
  );
}
