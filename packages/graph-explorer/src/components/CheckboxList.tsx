import { cn } from "@/utils";
import type {
  ComponentPropsWithoutRef,
  PropsWithChildren,
  ReactNode,
} from "react";
import { Label } from "./Label";
import { Checkbox } from "./Checkbox";
import { Virtuoso } from "react-virtuoso";

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
   * Checkboxes array to be displayed.
   */
  checkboxes: Array<CheckboxListItemProps>;
  /**
   * Id values shown as selected checkboxes
   */
  selectedIds: Set<string>;
  /**
   * Callback fired when the state is changed
   */
  onChange(id: string, isSelected: boolean): void;
  /**
   * Callback fired when the state of all checkboxes it wants to be changed.
   * If this method is not defined, the "all/none" Checkbox is removed.
   */
  onChangeAll(isSelected: boolean): void;
};

export default function CheckboxList({
  className,
  checkboxes,
  selectedIds,
  onChange,
  onChangeAll,
}: CheckboxListProps) {
  const numOfSelections = selectedIds.size;
  const totalCheckboxes = checkboxes.length;

  return (
    <div className={cn("flex h-full grow flex-col space-y-2", className)}>
      <div className="flex h-full grow flex-col gap-3">
        <Virtuoso
          className="h-full grow"
          data={checkboxes}
          components={{
            Header: () => (
              <CheckboxRow
                isTop={true}
                isBottom={false}
                aria-label="checkbox for all"
                checked={
                  numOfSelections > 0 && numOfSelections !== totalCheckboxes
                    ? "indeterminate"
                    : numOfSelections === totalCheckboxes
                }
                onCheckedChange={isSelected => {
                  onChangeAll(Boolean(isSelected));
                }}
                className="font-bold"
              >
                {numOfSelections} selected of {totalCheckboxes}
              </CheckboxRow>
            ),
          }}
          itemContent={(index, checkbox) => (
            <CheckboxRow
              isBottom={index === checkboxes.length - 1}
              isTop={false}
              aria-label={`checkbox for ${checkbox.id}`}
              checked={selectedIds.has(checkbox.id)}
              onCheckedChange={isSelected =>
                onChange(checkbox.id, Boolean(isSelected))
              }
            >
              <div className="grow">{checkbox.text}</div>
              <div className="[&_svg]:size-5">{checkbox.endAdornment}</div>
            </CheckboxRow>
          )}
        />
      </div>
    </div>
  );
}

function CheckboxRow({
  isBottom,
  isTop,
  className,
  children,
  ...checkboxProps
}: PropsWithChildren<
  { isTop: boolean; isBottom: boolean } & ComponentPropsWithoutRef<
    typeof Checkbox
  >
>) {
  return (
    <div className={cn("px-3", isTop && "pt-3", isBottom && "pb-3")}>
      <Label
        className={cn(
          "w-full border-x border-b px-3 py-3 text-text-primary hover:cursor-pointer",
          isTop && "rounded-t-lg border-t bg-background-contrast/50",
          isBottom && "rounded-b-lg",
          className
        )}
      >
        <Checkbox {...checkboxProps} />
        {children}
      </Label>
    </div>
  );
}
