import { cn } from "@/utils";
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
      noFormat,
      unitPlacement = "end",
    },
    ref
  ) => {
    const formattedValue = formatWithoutSymbol(value, maxFractionDigits);
    const symbol = getSymbolForNumber(value);

    return (
      <div ref={ref} className={cn(containerStyles(), className)}>
        {!!unit && unitPlacement === "start" && (
          <div className={cn(unitStyles, `unit`)}>{unit}</div>
        )}
        <div className="number">{!noFormat ? formattedValue : value}</div>
        {!noFormat && symbol && (
          <div className={cn(symbolStyles, `symbol`)}>{symbol}</div>
        )}
        {!!unit && unitPlacement === "end" && (
          <div className={cn(unitStyles, `unit`)}>{unit}</div>
        )}
      </div>
    );
  }
);

export default HumanReadableNumberFormatter;
