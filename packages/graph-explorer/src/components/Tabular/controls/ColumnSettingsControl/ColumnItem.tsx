import { Draggable } from "react-beautiful-dnd";
import { DragIcon } from "@/components/icons";
import Switch from "@/components/Switch";
import type { TabularInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";
import { useTabularControl } from "@/components/Tabular/TabularControlsProvider";

type ColumnItemProps<T extends Record<string, unknown>> = {
  columnId: string;
  column: TabularInstance<T>["columns"][number];
  index: number;
};

const ColumnItem = <T extends Record<string, unknown>>({
  columnId,
  column,
  index,
}: ColumnItemProps<T>) => {
  const {
    instance: { visibleColumns, toggleHideColumn },
  } = useTabularControl();

  return (
    <Draggable key={columnId} draggableId={columnId} index={index}>
      {provided => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={"column-item"}
        >
          <div className={"column-item-switch"}>
            <Switch
              size={"sm"}
              isSelected={visibleColumns[columnId] || false}
              onChange={() => toggleHideColumn(columnId)}
              isDisabled={column.definition?.unhideable}
            >
              <div className={"column-item-label"}>
                {column.instance.render("Header")}
              </div>
            </Switch>
          </div>
          <div
            className={"column-item-drag-handler"}
            {...provided.dragHandleProps}
          >
            <DragIcon />
          </div>
        </div>
      )}
    </Draggable>
  );
};
export default ColumnItem;
