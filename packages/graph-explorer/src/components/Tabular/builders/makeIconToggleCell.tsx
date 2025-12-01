import type { ReactNode } from "react";
import { IconButton } from "@/components";

import type { CellComponentProps } from "../useTabular";

type IconActionCellProps<T extends object> = {
  title: string;
  on: ReactNode;
  off: ReactNode;
  getValue: (props: CellComponentProps<T>) => boolean;
  onPress?(props: CellComponentProps<T>): void;
};

export const makeIconActionCell =
  <T extends object>({
    title,
    on,
    off,
    getValue,
    onPress,
  }: IconActionCellProps<T>) =>
  (props: CellComponentProps<T>) => {
    return (
      <div className="flex h-full w-full content-center justify-center text-[1.3rem] [&>div]:flex [&>div]:size-6 [&>div]:items-center [&>div]:justify-center [&>div]:rounded-full">
        <IconButton
          title={title}
          icon={getValue(props) ? on : off}
          size="small"
          variant="text"
          onClick={() => onPress?.(props)}
        />
      </div>
    );
  };

export default makeIconActionCell;
