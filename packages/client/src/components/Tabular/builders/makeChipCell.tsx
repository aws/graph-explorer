import { css } from "@emotion/css";
import type { ActiveThemeType, ProcessedTheme } from "../../../core";
import { useTheme } from "../../../core";

import { Chip } from "../../Chip/Chip";
import type { CellComponentProps } from "../useTabular";

const DEFAULT_COLOR = "#128ee5";
const DEFAULT_BACKGROUND_COLOR = "rgba(18, 142, 229, 0.1)";

interface ChipStyleProps {
  backgroundColor?: string;
  borderRadius?: string;
}

const styles = ({ backgroundColor, borderRadius }: ChipStyleProps) => css`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  font-weight: 600;

  > div {
    height: 24px;
    min-width: 24px;
    padding: 0;
    justify-content: center;
    align-items: center;
    background-color: ${backgroundColor || DEFAULT_BACKGROUND_COLOR};
    border-radius: ${borderRadius};
  }
`;

type ColorPropertyFunction<T extends object> = (
  value: unknown,
  cellProps: CellComponentProps<T>,
  theme?: ActiveThemeType<ProcessedTheme>
) => string;

type ChipCellProps<T extends object> = {
  getBackgroundColor?: ColorPropertyFunction<T>;
  getColor?: ColorPropertyFunction<T>;
  getBorderRadius?: ColorPropertyFunction<T>;
};

export const makeChipCell = <T extends object>({
  getBackgroundColor,
  getColor,
  getBorderRadius,
}: ChipCellProps<T>) => (props: CellComponentProps<T>) => {
  const [theme] = useTheme();
  return (
    <div
      className={styles({
        backgroundColor: getBackgroundColor?.(props.value, props, theme),
        borderRadius: getBorderRadius?.(props.value, props, theme),
      })}
    >
      <Chip color={getColor?.(props.value, props, theme) || DEFAULT_COLOR}>
        {props.value}
      </Chip>
    </div>
  );
};

export default makeChipCell;
