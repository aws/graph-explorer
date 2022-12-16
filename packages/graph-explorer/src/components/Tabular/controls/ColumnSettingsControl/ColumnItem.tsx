import { withClassNamePrefix } from "../../../../core";
import { Draggable } from "react-beautiful-dnd";
import { DragIcon } from "../../../icons";
import Switch from "../../../Switch";
import type { TabularInstance } from "../../helpers/tableInstanceToTabularInstance";
import { useTabularControl } from "../../TabularControlsProvider";

type ColumnItemProps<T extends object> = {
  classNamePrefix: string;
  columnId: string;
  column: TabularInstance<T>["columns"][number];
  index: number;
};

const ColumnItem = <T extends object>({
  classNamePrefix,
  columnId,
  column,
  index,
}: ColumnItemProps<T>) => {
  const pfx = withClassNamePrefix(classNamePrefix);

  const {
    instance: { visibleColumns, toggleHideColumn },
  } = useTabularControl();

  return (
    <Draggable key={columnId} draggableId={columnId} index={index}>
      {provided => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={pfx("column-item")}
        >
          <div className={pfx("column-item-switch")}>
            <Switch
              size={"sm"}
              isSelected={visibleColumns[columnId] || false}
              onChange={() => toggleHideColumn(columnId)}
              isDisabled={column.definition?.unhideable}
            >
              <div className={pfx("column-item-label")}>
                {column.instance.render("Header")}
              </div>
            </Switch>
          </div>
          <div
            className={pfx("column-item-drag-handler")}
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
