import type { ReactNode } from "react";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@/components";

import type { CellComponentProps } from "../useTabular";

type IconActionCellProps<T extends object> = {
  title: string;
  on: ReactNode;
  off: ReactNode;
  getValue: (props: CellComponentProps<T>) => boolean;
  onPress?(props: CellComponentProps<T>): void;
};

export default function makeIconActionCell<T extends object>({
  title,
  on,
  off,
  getValue,
  onPress,
}: IconActionCellProps<T>) {
  return (props: CellComponentProps<T>) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="small"
            variant="text"
            onClick={() => onPress?.(props)}
            className="active:bg-brand-100 text-brand-600 hover:text-brand-800 w-full cursor-pointer hover:bg-transparent"
          >
            {getValue(props) ? on : off}
            <span className="sr-only">{title}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>
    );
  };
}
