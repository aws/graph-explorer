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
    <Virtuoso
      className={cn("size-full", className)}
      data={checkboxes}
      components={{
        Header: () => (
          <CheckboxRow
            isTop={true}
            isBottom={false}
            aria-label="checkbox for all"
          >
            <Label className="font-bold">
              <Checkbox
                checked={
                  numOfSelections > 0 && numOfSelections !== totalCheckboxes
                    ? "indeterminate"
                    : numOfSelections === totalCheckboxes
                }
                onCheckedChange={isSelected => {
                  onChangeAll(Boolean(isSelected));
                }}
              />
              {numOfSelections} selected of {totalCheckboxes}
            </Label>
          </CheckboxRow>
        ),
      }}
      itemContent={(index, checkbox) => (
        <CheckboxRow
          isBottom={index === checkboxes.length - 1}
          isTop={false}
          aria-label={`checkbox for ${checkbox.id}`}
        >
          <Label className="text-foreground grid min-w-0 grid-cols-[auto_1fr_auto]">
            <Checkbox
              checked={selectedIds.has(checkbox.id)}
              onCheckedChange={isSelected =>
                onChange(checkbox.id, Boolean(isSelected))
              }
            />
            {checkbox.text}
            <div className="shrink-0 [&_svg]:size-5">
              {checkbox.endAdornment}
            </div>
          </Label>
        </CheckboxRow>
      )}
    />
  );
}

function CheckboxRow({
  isBottom,
  isTop,
  className,
  children,
}: PropsWithChildren<
  { isTop: boolean; isBottom: boolean } & ComponentPropsWithoutRef<
    typeof Checkbox
  >
>) {
  return (
    <div className={cn("px-3", isTop && "pt-3", isBottom && "pb-3")}>
      <div
        className={cn(
          "border-x border-b px-3 py-3 hover:cursor-pointer",
          isTop && "bg-background-contrast/50 rounded-t-lg border-t",
          isBottom && "rounded-b-lg",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
