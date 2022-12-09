import { cx } from "@emotion/css";
import groupBy from "lodash/groupBy";
import type { DragEvent, MouseEvent, ReactNode, Ref, RefObject } from "react";
import { forwardRef, memo, useEffect, useMemo, useState } from "react";
import type { VirtuosoHandle } from "react-virtuoso";
import { GroupedVirtuoso } from "react-virtuoso";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import useDebounceValue from "../../../hooks/useDebounceValue";
import { ChevronDownIcon, DetailsIcon, FileIcon } from "../../icons";
import Section from "../../Section";
import type {
  AdvancedListItemType,
  AdvancedListMouseEvent,
} from "../AdvancedList";
import styles from "../AdvancedList.styles";
import ElementsListItem from "./AdvancedListItem";
import EmptyState from "./EmptyState";
import Footer from "./Footer";

type ElementsListWithGroupsProps<T extends object> = {
  ref?: Ref<VirtuosoHandle>;
  items: AdvancedListItemType<T>[];
  classNamePrefix?: string;
  selectedItemsIds?: string[];
  draggable?: boolean;
  search?: string;
  category?: string;
  onItemClick?: (
    event: MouseEvent<HTMLDivElement>,
    item: AdvancedListItemType<T>,
    index: number
  ) => void;
  onItemMouseOver?: (
    event: MouseEvent<HTMLElement>,
    item: AdvancedListItemType<T>,
    index: number
  ) => void;
  onItemMouseOut?: (
    event: MouseEvent<HTMLElement>,
    item: AdvancedListItemType<T>,
    index: number
  ) => void;
  onItemMouseEnter?: AdvancedListMouseEvent;
  onItemMouseLeave?: AdvancedListMouseEvent;
  onDragStart?: (
    item: AdvancedListItemType<T>,
    group: AdvancedListItemType<T> | undefined,
    event: DragEvent<unknown>
  ) => void;
  emptyState?: {
    noSearchResultsTitle?: string;
    noSearchResultsSubtitle?: string;
    noSearchResultsIcon?: string;
    noElementsTitle?: string;
    noElementsSubtitle?: string;
    noElementsIcon?: string;
  };
  defaultItemType?: string;
  hideFooter?: boolean;
  hideCount?: boolean;
  renderPopover?: (
    item: AdvancedListItemType<any>,
    itemRef: RefObject<HTMLDivElement>
  ) => ReactNode;
  hidePopover?: boolean;
  activeItemIds?: string[];
};

const AdvancedListWithGroups = <T extends object>(
  {
    items,
    classNamePrefix = "ft",
    search,
    category = "all",
    draggable,
    onItemClick,
    onItemMouseOver,
    onItemMouseOut,
    onItemMouseEnter,
    onItemMouseLeave,
    selectedItemsIds,
    emptyState,
    onDragStart,
    defaultItemType,
    hideFooter,
    hideCount,
    renderPopover,
    hidePopover,
    activeItemIds,
  }: ElementsListWithGroupsProps<T>,
  ref: Ref<VirtuosoHandle>
) => {
  const [filteredItems, setFilteredItems] = useState<AdvancedListItemType<T>[]>(
    []
  );
  const [filteredGroups, setFilteredGroups] = useState<
    AdvancedListItemType<T>[]
  >([]);
  const [groupsCounts, setGroupsCounts] = useState<number[]>([]);
  const debouncedSearch = useDebounceValue(search, 300);
  const [collapsedSections, setCollapsedSection] = useState<Set<string>>(
    new Set()
  );
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  const allGroups = useMemo(() => {
    const groupedItems = items.filter(el => !!el.items);
    const unGroupedItems = items.filter(el => !el.items);
    if (unGroupedItems.length) {
      groupedItems.push({
        id: "ungrouped",
        title: "Uncategorized",
        items: unGroupedItems,
        icon: <DetailsIcon />,
      });
    }
    return groupedItems;
  }, [items]);

  const allItems: AdvancedListItemType<T>[] = useMemo(() => {
    let plainItems: AdvancedListItemType<T>[] = [];
    allGroups.forEach(group => {
      const groupItems = group.items?.map(item => ({
        ...item,
        group: group.id,
      }));
      plainItems = [...plainItems, ...(groupItems || [])];
    });
    return plainItems;
  }, [allGroups]);

  useEffect(() => {
    if (!debouncedSearch && category === "all") {
      setFilteredGroups(allGroups);
      setGroupsCounts(
        allGroups.map(group =>
          collapsedSections.has(group.id)
            ? 0
            : (group.items as AdvancedListItemType<T>[]).length
        )
      );
      setFilteredItems(
        collapsedSections.size > 0
          ? allItems.filter(
              item => !collapsedSections.has(item.group as string)
            )
          : allItems
      );
      return;
    }

    const searchValue = (debouncedSearch || "").toLowerCase();
    const filterFn = (item: AdvancedListItemType<T>) =>
      !!item.items || item.title.toLowerCase().includes(searchValue);
    const byCategory =
      category !== "all"
        ? allItems.filter(item => item.group === category)
        : allItems;

    const filtered = byCategory.filter(filterFn);
    const groupedItems = groupBy(filtered, "group");
    const groups: string[] = Object.keys(groupedItems);
    const filteredG = allGroups.filter(group => groups.includes(group.id));
    const filteredAndCollapsed = filtered.filter(
      item => !collapsedSections.has(item.group as string)
    );
    setFilteredGroups(filteredG);
    setGroupsCounts(
      groups.map((groupKey: string) =>
        collapsedSections.size > 0 && collapsedSections.has(groupKey)
          ? 0
          : groupedItems[groupKey].length
      )
    );
    setFilteredItems(filteredAndCollapsed);
  }, [
    debouncedSearch,
    setFilteredItems,
    setFilteredGroups,
    setGroupsCounts,
    category,
    allItems,
    allGroups,
    collapsedSections,
  ]);

  const showEmptyState = useMemo(() => {
    if (!search && allItems.length) {
      return false;
    }

    return !filteredItems.length;
  }, [filteredItems, search, allItems]);

  if (showEmptyState) {
    return (
      <EmptyState
        classNamePrefix={classNamePrefix}
        emptyState={emptyState}
        empty={!allItems.length}
        noSearchResults={!filteredItems.length}
      />
    );
  }

  return (
    <>
      <div style={{ height: hideFooter ? "100%" : "calc(100% - 49px)" }}>
        <GroupedVirtuoso
          ref={ref}
          groupCounts={groupsCounts}
          overscan={2000}
          groupContent={index => {
            const item = filteredGroups[index];
            return (
              <Section
                title={
                  <>
                    {item.icon || <FileIcon />}
                    {item.title || item.title}
                    {!hideCount &&
                      `(${(item.items as AdvancedListItemType<T>[]).length})`}
                  </>
                }
                disablePadding
                collapsible
                collapseAction="all"
                collapseIndicatorPosition="start"
                isCollapse={collapsedSections.has(item.id)}
                onCollapseChange={isCollapse => {
                  const newCollapseSections = new Set([...collapsedSections]);
                  if (newCollapseSections.has(item.id) && !isCollapse) {
                    newCollapseSections.delete(item.id);
                    setCollapsedSection(newCollapseSections);
                  }
                  if (isCollapse) {
                    setCollapsedSection(newCollapseSections.add(item.id));
                  }
                }}
                collapseAdornment={
                  <ChevronDownIcon
                    style={{
                      fontSize: 20,
                      transition: "transform 250ms ease",
                      transform: collapsedSections.has(item.id)
                        ? `rotate(0deg)`
                        : `rotate(90deg)`,
                    }}
                  />
                }
                classNamePrefix={classNamePrefix}
                showWhenEmpty
                className={cx(pfx("advanced-list-category"), {
                  [pfx("advanced-list-category-first")]: index === 0,
                })}
              />
            );
          }}
          itemContent={(index, groupIndex) => {
            const innerItem = filteredItems[index];
            const group = filteredGroups[groupIndex];

            return (
              <ElementsListItem
                item={innerItem}
                onClick={
                  onItemClick
                    ? (event, item) => onItemClick?.(event, item, index)
                    : undefined
                }
                onMouseOver={(event, item) =>
                  onItemMouseOver?.(event, item, index)
                }
                onMouseOut={(event, item) =>
                  onItemMouseOut?.(event, item, index)
                }
                onMouseEnter={event => onItemMouseEnter?.(event, index)}
                onMouseLeave={event => onItemMouseLeave?.(event, index)}
                group={group}
                classNamePrefix={classNamePrefix}
                draggable={draggable}
                isSelected={
                  !!innerItem.id && selectedItemsIds?.includes(innerItem.id)
                }
                isActive={activeItemIds?.includes(innerItem.id)}
                key={innerItem.id}
                onDragStart={onDragStart}
                defaultItemType={defaultItemType}
                renderPopover={renderPopover}
                hidePopover={hidePopover}
                overrideTitle={innerItem.titleComponent}
              />
            );
          }}
        />
      </div>
      {!hideFooter && (
        <Footer
          count={filteredItems.length}
          total={allItems.length}
          classNamePrefix={classNamePrefix}
          className={cx(
            styleWithTheme(styles.footerStyles(classNamePrefix)),
            pfx("advanced-list-footer")
          )}
        />
      )}
    </>
  );
};

export default memo(forwardRef(AdvancedListWithGroups));
