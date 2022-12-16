import { cx } from "@emotion/css";
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
import { useWithTheme, withClassNamePrefix } from "../../core";
import useDebounceValue from "../../hooks/useDebounceValue";
import LoadingSpinner from "../LoadingSpinner";
import Section from "../Section/Section";
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
  defaultItemType?: string;
  className?: string;
  wrapperElement?: ComponentType<PropsWithChildren<Record<string, unknown>>>;
};

export type AdvancedListMouseEvent<E = HTMLElement> = (
  event: MouseEvent<E>,
  index: number
) => void;

export type AdvancedListProps<T extends object> = {
  items: AdvancedListItemType<T>[];
  classNamePrefix?: string;
  className?: string;
  selectedItemsIds?: string[];
  draggable?: boolean;
  search?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  onSearch?: (searchTerm: string) => void;
  category?: string;
  onItemClick?: (
    event: MouseEvent<HTMLDivElement>,
    item: AdvancedListItemType<any>,
    index: number
  ) => void;
  onItemMouseOver?: (
    event: MouseEvent<HTMLElement>,
    item: AdvancedListItemType<any>,
    index: number
  ) => void;
  onItemMouseOut?: (
    event: MouseEvent<HTMLElement>,
    item: AdvancedListItemType<any>,
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
  defaultItemType?: string;
  hideFooter?: boolean;
  hideCount?: boolean;
  hideEmptyState?: boolean;
  renderPopover?: (
    item: AdvancedListItemType<any>,
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
    classNamePrefix = "ft",
    emptyState,
    onSearch,
    search,
    searchPlaceholder,
    onCategoryChange,
    category = "all",
    draggable = false,
    onItemClick,
    onItemMouseOver,
    onItemMouseOut,
    onItemMouseEnter,
    onItemMouseLeave,
    selectedItemsIds,
    isLoading,
    defaultItemType,
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
  const pfx = withClassNamePrefix(classNamePrefix);
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
        className={cx(
          styleWithTheme(styles.listStyles(classNamePrefix)),
          pfx("advanced-list"),
          className
        )}
      >
        {!isLoading && items.length > 0 && (
          <Section
            showWhenEmpty
            disableBorder
            title={
              hasHeader && (
                <div className={pfx("advanced-list-search-wrapper")}>
                  {children}
                  {onSearch && (
                    <SearchBar
                      classNamePrefix={classNamePrefix}
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
            classNamePrefix={classNamePrefix}
            className={cx(
              styleWithTheme(
                styles.headerStyles(classNamePrefix, noSearchResults)
              ),
              pfx("advanced-list-header")
            )}
          >
            {isGroupedListVisible && (
              <AdvancedListWithGroups
                ref={ref}
                items={items}
                search={debouncedSearch}
                category={category}
                draggable={draggable}
                classNamePrefix={classNamePrefix}
                selectedItemsIds={selectedItemsIds}
                onItemClick={onItemClick}
                onItemMouseOver={onItemMouseOver}
                onItemMouseOut={onItemMouseOut}
                onItemMouseEnter={onItemMouseEnter}
                onItemMouseLeave={onItemMouseLeave}
                defaultItemType={defaultItemType}
                hideFooter={hideFooter}
                hideCount={hideCount}
                renderPopover={renderPopover}
                hidePopover={hidePopover}
                activeItemIds={activeItemIds}
              />
            )}
            {isPlainListVisible && (
              <div className={pfx("advanced-list-nogroup")}>
                {!disableVirtualization && (
                  <Virtuoso
                    ref={ref}
                    data={filteredItems}
                    itemContent={index => {
                      const item = filteredItems[index];
                      return (
                        <div
                          className={cx(
                            pfx("advanced-list-nogroup-item-wrapper")
                          )}
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
                            classNamePrefix={classNamePrefix}
                            draggable={draggable}
                            isSelected={
                              !!item.id && selectedItemsIds?.includes(item.id)
                            }
                            key={item.id}
                            overrideTitle={item.titleComponent}
                            defaultItemType={defaultItemType}
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
                      className={pfx("advanced-list-nogroup-item-wrapper")}
                      key={item.id}
                    >
                      <ElementsListItem
                        item={item}
                        onClick={
                          onItemClick
                            ? (event, item) => onItemClick?.(event, item, index)
                            : undefined
                        }
                        classNamePrefix={classNamePrefix}
                        draggable={draggable}
                        isSelected={
                          !!item.id && selectedItemsIds?.includes(item.id)
                        }
                        key={item.id}
                        overrideTitle={item.titleComponent}
                        defaultItemType={defaultItemType}
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
          <div className={pfx("advanced-list-loading")}>
            <LoadingSpinner />
          </div>
        )}
        {!hideEmptyState && !hasGroups && isEmpty && (
          <EmptyState
            classNamePrefix={classNamePrefix}
            emptyState={emptyState}
            empty={search ? !items.length : false}
            noSearchResults={noSearchResults}
          />
        )}
        {!hasGroups && isFooterVisible && (
          <Footer
            count={filteredItems.length}
            total={itemsCount}
            classNamePrefix={classNamePrefix}
            className={cx(
              styleWithTheme(styles.footerStyles(classNamePrefix)),
              pfx("advanced-list-footer")
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
