import { css } from "@emotion/css";
import type { ReactNode } from "react";
import IconButton from "../../IconButton";

import type { CellComponentProps } from "../useTabular";

type IconActionCellProps<T extends object> = {
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

export const makeIconActionCell = <T extends object>({
  on,
  off,
  getValue,
  onPress,
}: IconActionCellProps<T>) => (props: CellComponentProps<T>) => {
  return (
    <div className={styles()}>
      <IconButton
        icon={getValue(props) ? on : off}
        size={"small"}
        variant={"text"}
        onPress={() => onPress?.(props)}
      />
    </div>
  );
};

export default makeIconActionCell;
