import { cn } from "@/utils";
import type {
  ComponentType,
  ForwardedRef,
  MouseEvent,
  PropsWithChildren,
  ReactNode,
  Ref,
  RefObject,
} from "react";
import { Children, forwardRef, useEffect, useMemo, useState } from "react";
import type { VirtuosoHandle } from "react-virtuoso";
import { Virtuoso } from "react-virtuoso";
import { useWithTheme } from "@/core";
import useDebounceValue from "@/hooks/useDebounceValue";
import LoadingSpinner from "@/components/LoadingSpinner";
import Section from "@/components/Section/Section";
import styles from "./AdvancedList.styles";
import ElementsListItem from "./internalComponents/AdvancedListItem";
import AdvancedListWithGroups from "./internalComponents/AdvancedListWithGroups";
import EmptyState from "./internalComponents/EmptyState";
import Footer from "./internalComponents/Footer";
import SearchBar from "./internalComponents/SearchBar";

export type AdvancedListItemType<T extends object> = {
  id: string;
  title: string;
  group?: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  endAdornment?: ReactNode;
  items?: AdvancedListItemType<T>[];
  properties?: T;
  titleComponent?: ReactNode;
  className?: string;
  wrapperElement?: ComponentType<PropsWithChildren<Record<string, unknown>>>;
};

export type AdvancedListMouseEvent<E = HTMLElement> = (
  event: MouseEvent<E>,
  index: number
) => void;

export type AdvancedListProps<T extends object> = {
  items: AdvancedListItemType<T>[];
  className?: string;
  selectedItemsIds?: string[];
  search?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  onSearch?: (searchTerm: string) => void;
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
  onCategoryChange?: (category: string) => void;
  emptyState?: {
    noSearchResultsTitle?: ReactNode;
    noSearchResultsSubtitle?: ReactNode;
    noSearchResultsIcon?: ReactNode;
    noElementsTitle?: ReactNode;
    noElementsSubtitle?: ReactNode;
    noElementsIcon?: ReactNode;
  };
  hideFooter?: boolean;
  hideCount?: boolean;
  hideEmptyState?: boolean;
  renderPopover?: (
    item: AdvancedListItemType<T>,
    itemRef: RefObject<HTMLDivElement>
  ) => ReactNode;
  hidePopover?: boolean;
  disableVirtualization?: boolean;
  activeItemIds?: string[];
};

function counterFn<T extends object>(
  prev: number,
  el: AdvancedListItemType<T>
) {
  return el.items ? prev + el.items.length : prev + 1;
}

const AdvancedList = <T extends object>(
  {
    items,
    className,
    children,
    emptyState,
    onSearch,
    search,
    searchPlaceholder,
    onCategoryChange,
    category = "all",
    onItemClick,
    onItemMouseOver,
    onItemMouseOut,
    onItemMouseEnter,
    onItemMouseLeave,
    selectedItemsIds,
    isLoading,
    hideFooter,
    hideCount,
    hideEmptyState,
    renderPopover,
    hidePopover,
    disableVirtualization,
    activeItemIds,
  }: PropsWithChildren<AdvancedListProps<T>>,
  ref: Ref<VirtuosoHandle>
) => {
  const [filteredItems, setFilteredItems] = useState<AdvancedListItemType<T>[]>(
    []
  );
  const debouncedSearch = useDebounceValue(search, 300);
  const styleWithTheme = useWithTheme();
  const hasGroups = useMemo(() => {
    return items.some(item => !!item.items?.length);
  }, [items]);

  const itemsCount = useMemo(() => {
    if (!hasGroups) {
      return items.length;
    }
    return items.reduce(counterFn, 0);
  }, [items, hasGroups]);

  useEffect(() => {
    if ((!debouncedSearch && category === "all") || hasGroups) {
      setFilteredItems(items);
      return;
    }

    const searchValue = (debouncedSearch || "").toLowerCase();
    const filterFn = (item: AdvancedListItemType<T>) =>
      !!item.items || item.title.toLowerCase().includes(searchValue);
    const filtered = items.filter(filterFn);
    setFilteredItems(filtered);
  }, [debouncedSearch, setFilteredItems, category, items, hasGroups]);

  const typesOptions = useMemo(() => {
    if (!hasGroups) {
      return [];
    }
    const types = items.reduce<{ label: string; value: string }[]>(
      (prev, item) => {
        if (item.items?.length) {
          return [...prev, { label: item.title, value: item.id }];
        }
        return [...prev];
      },
      []
    );
    types.unshift({ label: "All", value: "all" });
    return types;
  }, [items, hasGroups]);

  const hasHeader = onSearch || Children.count(children) > 0;

  const isEmpty = !isLoading && (!filteredItems.length || !items.length);
  const noSearchResults = search ? !filteredItems.length : false;

  const isFooterVisible =
    filteredItems.length > 0 &&
    onSearch &&
    onCategoryChange &&
    !isLoading &&
    !hideFooter;

  const isGroupedListVisible = hasGroups && !isLoading && items.length > 0;
  const isPlainListVisible = !hasGroups && !isLoading;
  return (
    <>
      <div
        className={cn(
          styleWithTheme(styles.listStyles),
          "advanced-list",
          className
        )}
      >
        {!isLoading && items.length > 0 && (
          <Section
            showWhenEmpty
            disableBorder
            title={
              hasHeader && (
                <div className="advanced-list-search-wrapper">
                  {children}
                  {onSearch && (
                    <SearchBar
                      types={typesOptions}
                      search={search}
                      searchPlaceholder={searchPlaceholder}
                      onSearch={onSearch}
                      type={category}
                      onTypeChange={onCategoryChange}
                    />
                  )}
                </div>
              )
            }
            disablePadding
            className={cn(
              styleWithTheme(styles.headerStyles(noSearchResults)),
              "advanced-list-header"
            )}
          >
            {isGroupedListVisible && (
              <AdvancedListWithGroups
                ref={ref}
                items={items}
                search={debouncedSearch}
                category={category}
                selectedItemsIds={selectedItemsIds}
                onItemClick={onItemClick}
                onItemMouseOver={onItemMouseOver}
                onItemMouseOut={onItemMouseOut}
                onItemMouseEnter={onItemMouseEnter}
                onItemMouseLeave={onItemMouseLeave}
                hideFooter={hideFooter}
                hideCount={hideCount}
                renderPopover={renderPopover}
                hidePopover={hidePopover}
                activeItemIds={activeItemIds}
              />
            )}
            {isPlainListVisible && (
              <div className="advanced-list-nogroup">
                {!disableVirtualization && (
                  <Virtuoso
                    ref={ref}
                    data={filteredItems}
                    itemContent={index => {
                      const item = filteredItems[index];
                      return (
                        <div
                          className={cn("advanced-list-nogroup-item-wrapper")}
                        >
                          <ElementsListItem
                            item={item}
                            onClick={
                              onItemClick
                                ? (event, item) =>
                                    onItemClick?.(event, item, index)
                                : undefined
                            }
                            onMouseOver={(event, item) =>
                              onItemMouseOver?.(event, item, index)
                            }
                            onMouseOut={(event, item) =>
                              onItemMouseOut?.(event, item, index)
                            }
                            onMouseEnter={event =>
                              onItemMouseEnter?.(event, index)
                            }
                            onMouseLeave={event =>
                              onItemMouseLeave?.(event, index)
                            }
                            isSelected={
                              !!item.id && selectedItemsIds?.includes(item.id)
                            }
                            key={item.id}
                            overrideTitle={item.titleComponent}
                            renderPopover={renderPopover}
                            hidePopover={hidePopover}
                          />
                        </div>
                      );
                    }}
                  />
                )}
                {disableVirtualization &&
                  filteredItems.map((item, index) => (
                    <div
                      className="advanced-list-nogroup-item-wrapper"
                      key={item.id}
                    >
                      <ElementsListItem
                        item={item}
                        onClick={
                          onItemClick
                            ? (event, item) => onItemClick?.(event, item, index)
                            : undefined
                        }
                        isSelected={
                          !!item.id && selectedItemsIds?.includes(item.id)
                        }
                        key={item.id}
                        overrideTitle={item.titleComponent}
                        renderPopover={renderPopover}
                        hidePopover={hidePopover}
                      />
                    </div>
                  ))}
              </div>
            )}
          </Section>
        )}
        {isLoading && (
          <div className="advanced-list-loading">
            <LoadingSpinner />
          </div>
        )}
        {!hideEmptyState && !hasGroups && isEmpty && (
          <EmptyState
            emptyState={emptyState}
            empty={search ? !items.length : false}
            noSearchResults={noSearchResults}
          />
        )}
        {!hasGroups && isFooterVisible && (
          <Footer
            count={filteredItems.length}
            total={itemsCount}
            className={cn(
              styleWithTheme(styles.footerStyles),
              "advanced-list-footer"
            )}
          />
        )}
      </div>
    </>
  );
};

export default forwardRef(AdvancedList) as <T extends object>(
  props: PropsWithChildren<AdvancedListProps<T>> & {
    ref?: ForwardedRef<VirtuosoHandle>;
  }
) => ReturnType<typeof AdvancedList>;
