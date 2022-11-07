import { css, cx } from "@emotion/css";
import { useHotkeys } from "@mantine/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vertex } from "../../@types/entities";

import {
  AddCircleIcon,
  AdvancedList,
  Card,
  Carousel,
  CloseIcon,
  Footer,
  GraphIcon,
  IconButton,
  Input,
  LoadingSpinner,
  PanelEmptyState,
  RemoveIcon,
  SearchSadIcon,
  Select,
  VertexIcon,
} from "../../components";
import { CarouselRef } from "../../components/Carousel/Carousel";
import HumanReadableNumberFormatter from "../../components/HumanReadableNumberFormatter";
import RemoveFromCanvasIcon from "../../components/icons/RemoveFromCanvasIcon";
import {
  fade,
  useConfiguration,
  useWithTheme,
  withClassNamePrefix,
} from "../../core";
import { useEntities, useFetchNode, useSet } from "../../hooks";
import useDisplayNames from "../../hooks/useDisplayNames";
import useTextTransform from "../../hooks/useTextTransform";

import { useClickOutside } from "../../utils";
import labelsByEngine from "../../utils/labelsByEngine";
import VertexDetail from "../EntityDetails/VertexDetail";
import defaultStyles from "./KeywordSearch.styles";
import toAdvancedList from "./toAdvancedList";
import useKeywordSearch from "./useKeywordSearch";

export type KeywordSearchProps = {
  classNamePrefix?: string;
  className?: string;
};

const KeywordSearch = ({
  classNamePrefix = "ft",
  className,
}: KeywordSearchProps) => {
  const config = useConfiguration();
  const fetchNode = useFetchNode();
  const [entities, setEntities] = useEntities();
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setInputFocused] = useState(false);
  const selection = useSet<string>(new Set());

  const {
    isFetching,
    onSearchTermChange,
    onVertexOptionChange,
    searchPlaceholder,
    searchResults,
    searchTerm,
    selectedVertexType,
    vertexOptions,
    selectedAttribute,
    attributesOptions,
    onAttributeOptionChange,
  } = useKeywordSearch({
    isOpen: isFocused,
  });

  const onInputFocusChange = useCallback(
    (isFocused: boolean) => () => {
      setInputFocused(isFocused);
    },
    []
  );

  useClickOutside({
    ref: rootRef,
    onClickOutside: onInputFocusChange(false),
    id: ["keyword-search-module", "layers"],
    disabledEvents: [],
  });

  useHotkeys([["Escape", onInputFocusChange(false)]]);

  const noResultsAfterFetching = !isFetching && searchResults.length === 0;
  const withResultsAfterFetching = !isFetching && searchResults.length > 0;
  const labels = labelsByEngine[config?.connection?.queryEngine || "gremlin"];
  const getDisplayNames = useDisplayNames();
  const textTransform = useTextTransform();
  const resultItems = useMemo(() => {
    return toAdvancedList(searchResults, {
      getGroupLabel: vertex => {
        const vtConfig = config?.getVertexTypeConfig(vertex.data.__v_type);
        return vtConfig?.displayLabel || textTransform(vertex.data.__v_type);
      },
      getItem: vertex => {
        const vtConfig = config?.getVertexTypeConfig(vertex.data.__v_type);
        const { name, longName } = getDisplayNames(vertex);
        return {
          className: css`
            .ft-start-adornment {
              background-color: ${fade(vtConfig?.color, 0.2)} !important;
              color: ${vtConfig?.color} !important;
            }
          `,
          group: vertex.data.__v_type,
          id: vertex.data.id,
          title: name,
          subtitle: longName,
          icon: (
            <VertexIcon
              iconUrl={vtConfig?.iconUrl}
              iconImageType={vtConfig?.iconImageType}
            />
          ),
          endAdornment: entities.nodes.find(
            n => n.data.__v_id === vertex.data.__v_id
          ) ? (
            <IconButton
              tooltipText={"Remove from canvas"}
              icon={
                <RemoveFromCanvasIcon className={pfx("graph-remove-icon")} />
              }
              size={"small"}
              variant={"text"}
              onPress={() => {
                setEntities(prev => {
                  return {
                    ...prev,
                    nodes: prev.nodes.filter(
                      n => n.data.__v_id !== vertex.data.__v_id
                    ),
                    forceSet: true,
                  };
                });
              }}
            />
          ) : (
            <IconButton
              tooltipText={"Add to canvas"}
              icon={<AddCircleIcon />}
              size={"small"}
              variant={"text"}
              onPress={() => fetchNode(vertex)}
            />
          ),
          properties: vertex,
        };
      },
    });
  }, [
    searchResults,
    config,
    getDisplayNames,
    textTransform,
    entities.nodes,
    pfx,
    setEntities,
    fetchNode,
  ]);

  const isTheNodeAdded = (nodeId: string): boolean => {
    const possibleNode = entities.nodes.find(
      addedNode => addedNode.data.id === nodeId
    );
    return possibleNode !== undefined;
  };

  const getNodeIdsToAdd = () => {
    const selectedNodeIds = Array.from(selection.state);
    return selectedNodeIds.filter(nodeId => !isTheNodeAdded(nodeId));
  };

  const getNodeSearchedById = (nodeId: string): Vertex | undefined => {
    return searchResults.find(result => result.data.id === nodeId);
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

  const carouselRef = useRef<CarouselRef>(null);
  useEffect(() => {
    carouselRef.current?.slideTo(selection.state.size - 1);
  }, [selection.state.size]);

  return (
    <div
      ref={rootRef}
      id={"keyword-search-module"}
      className={cx(styleWithTheme(defaultStyles(classNamePrefix)), className)}
    >
      {!isFocused && (
        <div className={pfx("bar-container")}>
          <Input
            className={pfx("search-input")}
            aria-label={"Search box"}
            hideError={true}
            value={searchTerm}
            placeholder={searchPlaceholder}
            onFocus={onInputFocusChange(true)}
            endAdornment={
              isFetching ? (
                <LoadingSpinner
                  style={{ width: 24, height: 24 }}
                  color={"var(--palette-primary-main)"}
                />
              ) : searchResults.length > 0 ? (
                <div className={pfx("results-adornment")}>
                  {searchResults.length} results
                </div>
              ) : undefined
            }
          />
        </div>
      )}
      {isFocused && (
        <Card className={pfx("panel-container")} elevation={3}>
          <div className={pfx("search-controls")}>
            <Select
              className={pfx("entity-select")}
              label={labels["node-type"]}
              labelPlacement={"inner"}
              hideError={true}
              options={vertexOptions}
              value={selectedVertexType}
              onChange={onVertexOptionChange}
            />
            <Select
              className={pfx("entity-select")}
              label={labels["node-attribute"]}
              labelPlacement={"inner"}
              hideError={true}
              options={attributesOptions}
              value={selectedAttribute}
              onChange={onAttributeOptionChange}
            />
            <Input
              className={pfx("search-input")}
              aria-label={"Search box"}
              hideError={true}
              autoFocus={true}
              value={searchTerm}
              onChange={onSearchTermChange}
              placeholder={searchPlaceholder}
            />
            <IconButton
              className={pfx("close-button")}
              variant={"text"}
              tooltipText={"Close search"}
              tooltipPlacement={"bottom-center"}
              icon={<CloseIcon />}
              onPress={onInputFocusChange(false)}
            />
          </div>
          <div className={pfx("search-results")}>
            {isFetching && (
              <PanelEmptyState
                classNamePrefix={classNamePrefix}
                title={"Searching..."}
                subtitle={
                  <div>
                    Looking {currentTotal != null && "at "}
                    {currentTotal != null && (
                      <HumanReadableNumberFormatter value={currentTotal} />
                    )}
                    {currentTotal != null && " records "}
                    for matching results
                  </div>
                }
                icon={<LoadingSpinner />}
              />
            )}
            {noResultsAfterFetching && (
              <PanelEmptyState
                classNamePrefix={classNamePrefix}
                title={"No Results"}
                subtitle={"Your criteria does not match with any record"}
                icon={<SearchSadIcon />}
              />
            )}
            {withResultsAfterFetching && (
              <div className={pfx("search-results-grid")}>
                <AdvancedList
                  classNamePrefix={classNamePrefix}
                  className={pfx("search-results-advanced-list")}
                  items={resultItems}
                  draggable={true}
                  defaultItemType={"graph-viewer__node"}
                  onItemClick={(event, item) => {
                    selection.toggle(item.id);
                  }}
                  selectedItemsIds={Array.from(selection.state)}
                  hideFooter
                />
                {selection.state.size > 0 && (
                  <Carousel
                    ref={carouselRef}
                    slidesToShow={1}
                    className={pfx("carousel")}
                  >
                    {Array.from(selection.state).map(nodeId => {
                      const node = getNodeSearchedById(nodeId);

                      return node !== undefined ? (
                        <VertexDetail
                          vertex={node}
                          key={nodeId}
                          enableDisplayAs={false}
                          disableConnections={true}
                        />
                      ) : null;
                    })}
                  </Carousel>
                )}
                {selection.state.size === 0 && (
                  <PanelEmptyState
                    className={pfx("node-preview")}
                    title="Select an item to preview"
                    icon={<GraphIcon />}
                  />
                )}
              </div>
            )}
          </div>
          <Footer className={pfx("actions-footer")}>
            <span className={pfx("footer-text")}>
              Search returned {searchResults.length} results
              {currentTotal != null && " of "}
              {currentTotal != null && (
                <HumanReadableNumberFormatter value={currentTotal} />
              )}
            </span>
            <div>
              <IconButton
                className={pfx("actions-button")}
                icon={<RemoveIcon />}
                onPress={() => selection.clear()}
              >
                <div className={pfx("icon-button-name")}>Clear Selection</div>
              </IconButton>
              <IconButton
                className={pfx("actions-button")}
                icon={<AddCircleIcon />}
                onPress={handleAddEntities}
              >
                <div className={pfx("icon-button-name")}>
                  {addSelectedNodesMessage()}
                </div>
              </IconButton>
            </div>
          </Footer>
        </Card>
      )}
    </div>
  );
};

export default KeywordSearch;
