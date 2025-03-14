import { css } from "@emotion/css";
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

const styles = () => css`
  display: flex;
  justify-content: center;
  align-content: center;
  width: 100%;
  height: 100%;
  font-size: 1.3rem;

  > div {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 24px;
    height: 24px;
    border-radius: 12px;
  }
`;

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
      <div className={styles()}>
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
