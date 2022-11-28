import { cx } from "@emotion/css";
import { ReactNode } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import Checkbox from "../Checkbox/Checkbox";
import defaultStyles from "./CheckboxList.styles";

export type CheckboxListItemProps = {
  id: string;
  text: ReactNode;
  endAdornment?: ReactNode;
  isDisabled?: boolean;
};

export type CheckboxListProps = {
  /**
   * Prefix for style classes.
   */
  classNamePrefix?: string;
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
  classNamePrefix = "ft",
  className,
  title,
  checkboxes,
  isDisabled,
  selectedIds,
  onChange,
  onChangeAll,
}: CheckboxListProps) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const stylesWithTheme = useWithTheme();

  const numOfSelections = selectedIds.size;
  const totalCheckboxes = checkboxes.length;
  const allDisabled = checkboxes.reduce(
    (disabled, ch) => disabled && !!ch.isDisabled,
    true
  );

  return (
    <div
      className={cx(
        stylesWithTheme(defaultStyles(classNamePrefix)),
        pfx("checkbox-list"),
        className
      )}
    >
      {title && <div className={pfx("title")}>{title}</div>}
      <div className={pfx("content")}>
        {checkboxes.map(checkbox => {
          return (
            <div key={checkbox.id} className={pfx("checkbox-container")}>
              <Checkbox
                aria-label={`checkbox for ${checkbox.id}`}
                isSelected={selectedIds.has(checkbox.id)}
                isDisabled={isDisabled || checkbox.isDisabled}
                onChange={isSelected => onChange(checkbox.id, isSelected)}
                className={pfx("checkbox")}
              >
                <div className={pfx("checkbox-content")}>
                  <div>{checkbox.text}</div>
                  <div className={pfx("icon")}>{checkbox.endAdornment}</div>
                </div>
              </Checkbox>
            </div>
          );
        })}
        {onChangeAll && (
          <div className={pfx("selector")}>
            <div className={pfx("checkbox-container")}>
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
                <div className={pfx("checkbox-content")}>
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
