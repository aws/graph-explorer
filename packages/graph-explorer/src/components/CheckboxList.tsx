import { cn } from "@/utils";
import { ReactNode } from "react";
import Divider from "./Divider";
import { Label } from "./Label";
import { Checkbox } from "./Checkbox";

export type CheckboxListItemProps = {
  id: string;
  text: ReactNode;
  endAdornment?: ReactNode;
  isDisabled?: boolean;
};

export type CheckboxListProps = {
  /**
   * Override or extend the styles applied to the component.
   */
  className?: string;
  /**
   * The content to display as element title.
   */
  title?: string;
  /**
   * Checkboxes array to be displayed.
   */
  checkboxes: Array<CheckboxListItemProps>;
  /**
   * Id values shown as selected checkboxes
   */
  selectedIds: Set<string>;
  /**
   * If true <code>true</code> the component is disabled
   */
  isDisabled?: boolean;
  /**
   * Callback fired when the state is changed
   */
  onChange(id: string, isSelected: boolean): void;
  /**
   * Callback fired when the state of all checkboxes it wants to be changed.
   * If this method is not defined, the "all/none" Checkbox is removed.
   */
  onChangeAll?(isSelected: boolean): void;
};

export default function CheckboxList({
  className,
  title,
  checkboxes,
  isDisabled,
  selectedIds,
  onChange,
  onChangeAll,
}: CheckboxListProps) {
  const numOfSelections = selectedIds.size;
  const totalCheckboxes = checkboxes.length;
  const allDisabled = checkboxes.reduce(
    (disabled, ch) => disabled && !!ch.isDisabled,
    true
  );

  return (
    <div className={cn("space-y-2", className)}>
      {title && <div className="text-base font-medium">{title}</div>}
      <div className="border-divider flex flex-col gap-3 rounded-lg border py-3">
        {checkboxes.map(checkbox => {
          return (
            <Label
              key={checkbox.id}
              className="w-full px-3 hover:cursor-pointer"
            >
              <Checkbox
                aria-label={`checkbox for ${checkbox.id}`}
                checked={selectedIds.has(checkbox.id)}
                disabled={isDisabled || checkbox.isDisabled}
                onCheckedChange={isSelected =>
                  onChange(checkbox.id, Boolean(isSelected))
                }
              ></Checkbox>
              <div className="grow">{checkbox.text}</div>
              <div className="[&_svg]:size-5">{checkbox.endAdornment}</div>
            </Label>
          );
        })}
        <Divider />
        {onChangeAll && (
          <Label className="inline-flex items-center gap-2 px-3 tabular-nums hover:cursor-pointer">
            <Checkbox
              aria-label="checkbox for all"
              checked={
                numOfSelections > 0 && numOfSelections !== totalCheckboxes
                  ? "indeterminate"
                  : numOfSelections === totalCheckboxes
              }
              disabled={isDisabled || allDisabled}
              onCheckedChange={isSelected => {
                onChangeAll(Boolean(isSelected));
              }}
            />
            {numOfSelections} selected of {totalCheckboxes}
          </Label>
        )}
      </div>
    </div>
  );
}
