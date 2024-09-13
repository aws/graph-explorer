import { cn } from "@/utils";
import { ReactNode } from "react";
import { useWithTheme } from "@/core";
import Checkbox from "@/components/Checkbox/Checkbox";
import defaultStyles from "./CheckboxList.styles";

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

export const CheckboxList = ({
  className,
  title,
  checkboxes,
  isDisabled,
  selectedIds,
  onChange,
  onChangeAll,
}: CheckboxListProps) => {
  const stylesWithTheme = useWithTheme();

  const numOfSelections = selectedIds.size;
  const totalCheckboxes = checkboxes.length;
  const allDisabled = checkboxes.reduce(
    (disabled, ch) => disabled && !!ch.isDisabled,
    true
  );

  return (
    <div
      className={cn(stylesWithTheme(defaultStyles), "checkbox-list", className)}
    >
      {title && <div className="title">{title}</div>}
      <div className="content">
        {checkboxes.map(checkbox => {
          return (
            <div key={checkbox.id} className={"checkbox-container"}>
              <Checkbox
                aria-label={`checkbox for ${checkbox.id}`}
                isSelected={selectedIds.has(checkbox.id)}
                isDisabled={isDisabled || checkbox.isDisabled}
                onChange={isSelected => onChange(checkbox.id, isSelected)}
                className={"checkbox"}
              >
                <div className={"checkbox-content"}>
                  <div>{checkbox.text}</div>
                  <div className={"icon"}>{checkbox.endAdornment}</div>
                </div>
              </Checkbox>
            </div>
          );
        })}
        {onChangeAll && (
          <div className={"selector"}>
            <div className={"checkbox-container"}>
              <Checkbox
                aria-label={"checkbox for all"}
                isIndeterminate={
                  numOfSelections > 0 && numOfSelections !== totalCheckboxes
                }
                isSelected={numOfSelections === totalCheckboxes}
                isDisabled={isDisabled || allDisabled}
                onChange={isSelected => {
                  onChangeAll(isSelected);
                }}
              >
                <div className={"checkbox-content"}>
                  <div>
                    {numOfSelections} selected of {totalCheckboxes}
                  </div>
                </div>
              </Checkbox>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckboxList;
