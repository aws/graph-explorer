import { css, cx } from "@emotion/css";

import type { ActiveThemeType, ProcessedTheme } from "../../../core";
import { useTheme, useWithTheme } from "../../../core";

import type { CellComponentProps } from "../useTabular";

const styles = (activeTheme: ActiveThemeType<ProcessedTheme>) => css`
  display: flex;
  height: 24px;

  .box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20%;
    font-size: 12px;
    box-sizing: border-box;
    height: 100%;
    border-left: 1px solid ${activeTheme.theme.palette.background.default};
    color: ${activeTheme.theme.palette.common.white};

    &.box-empty {
      color: ${activeTheme.theme.palette.text.primary};
    }
    &:first-child {
      border-bottom-left-radius: ${activeTheme.theme.shape.borderRadius};
      border-top-left-radius: ${activeTheme.theme.shape.borderRadius};
    }
    &:last-child {
      border-bottom-right-radius: ${activeTheme.theme.shape.borderRadius};
      border-top-right-radius: ${activeTheme.theme.shape.borderRadius};
    }
  }
`;

type BarChartCellProps = {
  getBackground(item: unknown, index: number): string;
};

const makeBarChartCell = <T extends object>({
  getBackground,
}: BarChartCellProps) => ({ value }: CellComponentProps<T>) => {
  const items = value as number[];

  const [theme] = useTheme();
  const styleWithTheme = useWithTheme();
  return (
    <div className={styleWithTheme(styles)}>
      {items.map((item, index) => {
        const value = item?.toFixed(1);
        const barBackground =
          parseInt(value) === 0
            ? theme.theme.palette.border
            : getBackground(item, index);
        return (
          <div
            key={`item-${index}`}
            className={cx("box", { "box-empty": parseInt(value) === 0 })}
            style={{ background: barBackground }}
          >
            {Number.isInteger(item) ? item : item?.toFixed(1)}
          </div>
        );
      })}
    </div>
  );
};

export default makeBarChartCell;
