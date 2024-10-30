import { css } from "@emotion/css";
import { cn } from "@/utils";
import { useClickOutside, useHotkeys } from "@mantine/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vertex } from "@/types/entities";

import {
  AddCircleIcon,
  AdvancedList,
  Card,
  Carousel,
  CloseIcon,
  GraphIcon,
  IconButton,
  Input,
  LoadingSpinner,
  PanelEmptyState,
  RemoveIcon,
  SearchSadIcon,
  Select,
  VertexIcon,
  Button,
  PanelError,
} from "@/components";
import { CarouselRef } from "@/components/Carousel/Carousel";
import HumanReadableNumberFormatter from "@/components/HumanReadableNumberFormatter";
import RemoveFromCanvasIcon from "@/components/icons/RemoveFromCanvasIcon";
import { fade, useConfiguration, useWithTheme } from "@/core";
import { useEntities, useFetchNode, useSet } from "@/hooks";
import useDisplayNames from "@/hooks/useDisplayNames";
import useTextTransform from "@/hooks/useTextTransform";
import useTranslations from "@/hooks/useTranslations";

import NodeDetail from "@/modules/EntityDetails/NodeDetail";
import defaultStyles from "./KeywordSearch.styles";
import toAdvancedList from "./toAdvancedList";
import useKeywordSearch from "./useKeywordSearch";
import { useCancelKeywordSearch } from "./useKeywordSearchQuery";
import { UseQueryResult } from "@tanstack/react-query";
import { KeywordSearchResponse } from "@/connector/useGEFetchTypes";
import { SetResult } from "@/hooks/useSet";

export type KeywordSearchProps = {
  className?: string;
};

export default function KeywordSearch({ className }: KeywordSearchProps) {
  const config = useConfiguration();
  const t = useTranslations();
  const fetchNode = useFetchNode();
  const [entities] = useEntities();
  const styleWithTheme = useWithTheme();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setInputFocused] = useState(false);
  const selection = useSet<string>(new Set());

  const {
    query,
    onSearchTermChange,
    onVertexOptionChange,
    searchPlaceholder,
    searchTerm,
    selectedVertexType,
    vertexOptions,
    selectedAttribute,
    attributesOptions,
    onAttributeOptionChange,
    exactMatch,
    exactMatchOptions,
    onExactMatchChange,
  } = useKeywordSearch({
    isOpen: isFocused,
  });
  const onInputFocusChange = useCallback(
    (isFocused: boolean) => () => {
      setInputFocused(isFocused);
    },
    []
  );

  const ref = useClickOutside(onInputFocusChange(false));
  useHotkeys([["Escape", onInputFocusChange(false)]]);

  const searchResults = useMemo(() => query.data?.vertices ?? [], [query.data]);

  const isTheNodeAdded = (nodeId: string): boolean => {
    const possibleNode = entities.nodes.find(
      addedNode => addedNode.id === nodeId
    );
    return possibleNode !== undefined;
  };

  const getNodeIdsToAdd = () => {
    const selectedNodeIds = Array.from(selection.state);
    return selectedNodeIds.filter(nodeId => !isTheNodeAdded(nodeId));
  };

  const getNodeSearchedById = (nodeId: string): Vertex | undefined => {
    return searchResults.find(result => result.id === nodeId);
  };

  const addSelectedNodesMessage = () => {
    const nodeIdsToAdd = getNodeIdsToAdd();
    const numberOfNodesToAdd =
      nodeIdsToAdd.length > 0 ? `(${nodeIdsToAdd.length})` : "";
    return `Add Selected ${numberOfNodesToAdd}`;
  };

  const handleOnClose = useCallback(() => {
    selection.clear();
    setInputFocused(false);
  }, [selection]);

  const handleAddEntities = () => {
    const nodeIdsToAdd = getNodeIdsToAdd();
    const nodes = nodeIdsToAdd
      .map(getNodeSearchedById)
      .filter(Boolean) as Vertex[];
    fetchNode(nodes);
    handleOnClose();
  };

  const currentTotal = useMemo(() => {
    if (!config?.vertexTypes.length) {
      return null;
    }

    if (selectedVertexType === "__all") {
      let total = 0;

      for (const vt of config.vertexTypes) {
        const currTotal = config?.getVertexTypeConfig(vt)?.total;
        if (currTotal == null) {
          return null;
        }

        total += currTotal;
      }

      return total;
    }

    const vtConfig = config?.getVertexTypeConfig(selectedVertexType);
    return vtConfig?.total;
  }, [config, selectedVertexType]);

  useEffect(() => {
    selection.clear();
    // selection is non-trivial type, and it makes the effect change infinitely
    // selection.clear does not have deps,
    // so its initial value is valid for resetting the selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVertexType, searchTerm]);

  return (
    <div
      ref={rootRef}
      id="keyword-search-module"
      className={cn(styleWithTheme(defaultStyles), className)}
    >
      {!isFocused && (
        <div className="bar-container">
          <Input
            className="search-input"
            aria-label="Search box"
            hideError={true}
            value={searchTerm}
            placeholder={searchPlaceholder}
            onFocus={onInputFocusChange(true)}
            endAdornment={
              query.isFetching ? (
                <LoadingSpinner
                  style={{ width: 24, height: 24 }}
                  color="var(--palette-primary-main)"
                />
              ) : searchResults.length > 0 ? (
                <div className="results-adornment">
                  {searchResults.length} results
                </div>
              ) : undefined
            }
          />
        </div>
      )}
      {isFocused && (
        <Card ref={ref} className="panel-container" elevation={3}>
          <div className="flex h-[42px] flex-row gap-2">
            <Select
              className="w-[100px] min-w-[100px] grow"
              label={t("keyword-search.node-type")}
              labelPlacement="inner"
              hideError={true}
              options={vertexOptions}
              value={selectedVertexType}
              onChange={onVertexOptionChange}
              menuWidth={150}
            />
            <Select
              className="w-[100px] min-w-[100px] grow"
              label={t("keyword-search.node-attribute")}
              labelPlacement="inner"
              hideError={true}
              options={attributesOptions}
              value={selectedAttribute}
              onChange={onAttributeOptionChange}
              menuWidth={150}
            />
            <Select
              className="w-[100px] min-w-[100px] grow"
              label={t("keyword-search.node-exact-match")}
              labelPlacement="inner"
              hideError={true}
              options={exactMatchOptions}
              value={exactMatch ? "Exact" : "Partial"}
              onChange={onExactMatchChange}
              menuWidth={150}
            />
            <Input
              className="grow-[5]"
              aria-label="Search box"
              hideError={true}
              autoFocus={true}
              value={searchTerm}
              onChange={onSearchTermChange}
              placeholder={searchPlaceholder}
            />
            <IconButton
              className="close-button self-center"
              variant="text"
              tooltipText="Close search"
              tooltipPlacement="bottom-center"
              icon={<CloseIcon />}
              onPress={onInputFocusChange(false)}
            />
          </div>
          <div className="search-results">
            <SearchResults
              query={query}
              currentTotal={currentTotal}
              selection={selection}
              close={() => setInputFocused(false)}
            />
          </div>
          <div className="actions-footer">
            <span className="footer-text">
              Search returned {searchResults.length} results
              {currentTotal != null && " of "}
              {currentTotal != null && (
                <HumanReadableNumberFormatter value={currentTotal} />
              )}
            </span>
            <Button
              icon={<RemoveIcon />}
              onPress={() => selection.clear()}
              className="refuse-shrink"
            >
              Clear Selection
            </Button>
            <Button
              icon={<AddCircleIcon />}
              onPress={handleAddEntities}
              className="refuse-shrink"
            >
              {addSelectedNodesMessage()}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function SearchResults({
  query,
  currentTotal,
  selection,
  close,
}: {
  query: UseQueryResult<KeywordSearchResponse | null, Error>;
  currentTotal: number | null | undefined;
  selection: SetResult<string>;
  close: () => void;
}) {
  const config = useConfiguration();
  const fetchNode = useFetchNode();
  const [entities, setEntities] = useEntities();
  const getDisplayNames = useDisplayNames();
  const textTransform = useTextTransform();

  const searchResults = useMemo(() => query.data?.vertices ?? [], [query.data]);
  const cancelAll = useCancelKeywordSearch();

  const resultItems = useMemo(() => {
    return toAdvancedList(searchResults, {
      getGroupLabel: vertex => {
        const vtConfig = config?.getVertexTypeConfig(vertex.type);
        return vtConfig?.displayLabel || textTransform(vertex.type);
      },
      getItem: vertex => {
        const vtConfig = config?.getVertexTypeConfig(vertex.type);
        const { name, longName } = getDisplayNames(vertex);
        return {
          className: css`
            .start-adornment {
              background-color: ${fade(vtConfig?.color, 0.2)} !important;
              color: ${vtConfig?.color} !important;
            }
          `,
          group: vertex.type,
          id: vertex.id,
          title: name,
          subtitle: longName,
          icon: (
            <VertexIcon
              iconUrl={vtConfig?.iconUrl}
              iconImageType={vtConfig?.iconImageType}
            />
          ),
          endAdornment: entities.nodes.find(n => n.id === vertex.id) ? (
            <IconButton
              tooltipText="Remove from canvas"
              icon={<RemoveFromCanvasIcon className="graph-remove-icon" />}
              size="small"
              variant="text"
              onPress={() => {
                setEntities(prev => {
                  return {
                    ...prev,
                    nodes: prev.nodes.filter(n => n.id !== vertex.id),
                    forceSet: true,
                  };
                });
              }}
            />
          ) : (
            <IconButton
              tooltipText="Add to canvas"
              icon={<AddCircleIcon />}
              size="small"
              variant="text"
              onPress={() => {
                fetchNode(vertex);
                close();
              }}
            />
          ),
          properties: vertex,
        };
      },
    });
  }, [
    searchResults,
    config,
    textTransform,
    getDisplayNames,
    entities.nodes,
    setEntities,
    fetchNode,
    close,
  ]);

  const carouselRef = useRef<CarouselRef>(null);
  useEffect(() => {
    carouselRef.current?.slideTo(selection.state.size - 1);
  }, [selection.state.size]);

  if (query.isLoading) {
    return (
      <PanelEmptyState
        title="Searching..."
        subtitle={
          currentTotal ? (
            <div>
              Looking at{" "}
              <HumanReadableNumberFormatter
                value={currentTotal}
                maxFractionDigits={0}
              />{" "}
              records for matching results
            </div>
          ) : (
            "Looking for matching results"
          )
        }
        actionLabel="Cancel"
        onAction={() => cancelAll()}
        icon={<LoadingSpinner />}
      />
    );
  }

  if (query.isError && !query.data) {
    return <PanelError error={query.error} onRetry={query.refetch} />;
  }

  if (!query.data || query.data.vertices.length === 0) {
    return (
      <PanelEmptyState
        title="No Results"
        subtitle="Your criteria does not match with any record"
        icon={<SearchSadIcon />}
      />
    );
  }

  return (
    <div className="search-results-grid">
      <AdvancedList
        className="search-results-advanced-list"
        items={resultItems}
        draggable={true}
        defaultItemType="graph-viewer__node"
        onItemClick={(_event, item) => {
          selection.toggle(item.id);
        }}
        selectedItemsIds={Array.from(selection.state)}
        hideFooter
      />
      {selection.state.size > 0 && (
        <Carousel
          ref={carouselRef}
          slidesToShow={1}
          className="carousel"
          pagination={{
            el: `.swiper-pagination`,
          }}
        >
          {Array.from(selection.state).map(nodeId => {
            const node = searchResults.find(n => n.id === nodeId);

            return node !== undefined ? (
              <NodeDetail key={nodeId} node={node} hideNeighbors={true} />
            ) : null;
          })}
        </Carousel>
      )}
      {selection.state.size === 0 && (
        <PanelEmptyState
          className="node-preview"
          title="Select an item to preview"
          icon={<GraphIcon />}
        />
      )}
    </div>
  );
}
