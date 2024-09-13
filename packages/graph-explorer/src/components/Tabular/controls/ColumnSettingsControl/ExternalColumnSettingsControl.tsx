import { css } from "@emotion/css";
import { cn } from "@/utils";
import { useCallback, useState } from "react";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import { useLayer } from "react-laag";
import Button from "@/components/Button";
import Card from "@/components/Card";
import IconButton from "@/components/IconButton";
import { ManageColumnsIcon } from "@/components/icons";
import type { TabularInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";
import { useTabularControl } from "@/components/Tabular/TabularControlsProvider";
import ColumnItem from "./ColumnItem";
import defaultStyles from "./ColumnSettingsControl.styles";

// These styles are only applied to top level container
// because the renderedLayer is not a child (uses portal)
const rootStyles = () => css`
  position: relative;
  display: flex;
  align-items: center;
`;

interface ColumnOrderControlProps<T extends Record<string, unknown>> {
  instance: TabularInstance<T>;
  className?: string;
}

const reorder = (list: string[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export const ColumnSettingsControl = <T extends Record<string, unknown>>({
  className,
}: ColumnOrderControlProps<T>) => {
  const [isContentVisible, setIsContentVisible] = useState(false);

  const {
    instance: {
      columns,
      columnOrder,
      setColumnOrder,
      toggleHideColumn,
      initialColumnOrder,
      initialHiddenColumns,
    },
  } = useTabularControl();

  const { renderLayer, triggerProps, layerProps } = useLayer({
    isOpen: isContentVisible,
    onOutsideClick: () => {
      setIsContentVisible(false);
    },
    onDisappear: () => {
      setIsContentVisible(false);
    },
    overflowContainer: true,
    auto: true,
    placement: "bottom-end",
    triggerOffset: 4,
  });

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return;
      }

      if (result.destination.index === result.source.index) {
        return;
      }

      setColumnOrder(
        reorder(columnOrder, result.source.index, result.destination.index)
      );
    },
    [columnOrder, setColumnOrder]
  );

  const onReset = useCallback(() => {
    columns.forEach(column => {
      if (initialHiddenColumns.includes(column.instance.id)) {
        toggleHideColumn(column.instance.id, true);
      } else {
        toggleHideColumn(column.instance.id, false);
      }
    });

    setColumnOrder(initialColumnOrder);
  }, [
    columns,
    initialColumnOrder,
    initialHiddenColumns,
    setColumnOrder,
    toggleHideColumn,
  ]);

  return (
    <div id="columns-settings-control" className={rootStyles()}>
      <IconButton
        variant={"text"}
        size={"base"}
        icon={<ManageColumnsIcon />}
        onPress={() => setIsContentVisible(visible => !visible)}
        {...triggerProps}
      />
      {renderLayer(
        <div {...layerProps} className={cn(defaultStyles(), className)}>
          {isContentVisible && (
            <Card className={"card"}>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="columns-list">
                  {provided => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={"columns-list"}
                    >
                      {columnOrder.map((columnId, index) => {
                        const currentColumn = columns.find(
                          column => column.instance.id === columnId
                        );
                        if (!currentColumn) {
                          return null;
                        }

                        return (
                          <ColumnItem
                            key={columnId}
                            index={index}
                            columnId={columnId}
                            column={currentColumn}
                          />
                        );
                      })}
                      {provided.placeholder}
                      <div className={"action-item"}>
                        <Button
                          variant={"text"}
                          size={"small"}
                          onPress={onReset}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ColumnSettingsControl;
