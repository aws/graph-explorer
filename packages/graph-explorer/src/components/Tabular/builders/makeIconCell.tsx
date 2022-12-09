import { css } from "@emotion/css";
import { ReactNode } from "react";
import type { CellComponentProps } from "../useTabular";

type IconCellProps<T extends object> = {
  icon: ReactNode;
  getColor?(value: unknown, cellProps: CellComponentProps<T>): string;
  getBackgroundColor?(value: unknown, cellProps: CellComponentProps<T>): string;
};

const styles = () => css`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  > div {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 24px;
    height: 24px;
    border-radius: 12px;
  }
`;

export const makeIconCell = <T extends object>({
  icon,
  getColor,
  getBackgroundColor,
}: IconCellProps<T>) => (props: CellComponentProps<T>) => {
  return (
    <div className={styles()}>
      <div
        style={{
          fontSize: 24,
          background: getBackgroundColor?.(props.value, props) || "inherit",
          color: getColor?.(props.value, props) || "inherit",
        }}
      >
        {icon}
      </div>
    </div>
  );
};

export default makeIconCell;
