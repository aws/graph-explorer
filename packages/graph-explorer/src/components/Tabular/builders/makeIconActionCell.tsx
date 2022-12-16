import { css } from "@emotion/css";
import { ReactNode } from "react";

import IconButton from "../../IconButton";
import type { CellComponentProps } from "../useTabular";

type IconActionCellProps<T extends object> = {
  icon: ReactNode;
  getIcon?: (props: CellComponentProps<T>) => ReactNode;
  onPress(props: CellComponentProps<T>): void;
};

const styles = () => css`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  button {
    color: #9a9a9a;
    &:hover {
      color: #128ee5;
    }
  }
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
  icon,
  getIcon,
  onPress,
}: IconActionCellProps<T>) => (props: CellComponentProps<T>) => {
  return (
    <div className={styles()}>
      <IconButton
        icon={getIcon?.(props) || icon}
        size={"small"}
        variant={"text"}
        onPress={() => onPress(props)}
      />
    </div>
  );
};

export default makeIconActionCell;
