import { cx } from "@emotion/css";

import { forwardRef } from "react";

import { formatWithoutSymbol, getSymbolForNumber } from "./numberFormat";
import {
  containerStyles,
  symbolStyles,
  unitStyles,
} from "./NumberFormatter.styles";

export interface HumanReadableNumberFormatterProps {
  value: number;
  /* unit for the value */
  unit?: string;
  /* max number of decimals to show */
  maxFractionDigits?: number;
  /* print rawValue */
  noFormat?: boolean;
  className?: string;
  classNamePrefix?: string;
  unitPlacement?: "start" | "end";
}

export const HumanReadableNumberFormatter = forwardRef<
  HTMLDivElement,
  HumanReadableNumberFormatterProps
>(
  (
    {
      value,
      unit,
      maxFractionDigits = 2,
      className,
      classNamePrefix = "ft",
      noFormat,
      unitPlacement = "end",
    },
    ref
  ) => {
    const formattedValue = formatWithoutSymbol(value, maxFractionDigits);
    const symbol = getSymbolForNumber(value);

    return (
      <div ref={ref} className={cx(containerStyles(), className)}>
        {!!unit && unitPlacement === "start" && (
          <div className={cx(unitStyles, `${classNamePrefix}-unit`)}>
            {unit}
          </div>
        )}
        <div className={`${classNamePrefix}-number`}>
          {!noFormat ? formattedValue : value}
        </div>
        {!noFormat && symbol && (
          <div className={cx(symbolStyles, `${classNamePrefix}-symbol`)}>
            {symbol}
          </div>
        )}
        {!!unit && unitPlacement === "end" && (
          <div className={cx(unitStyles, `${classNamePrefix}-unit`)}>
            {unit}
          </div>
        )}
      </div>
    );
  }
);

export default HumanReadableNumberFormatter;
