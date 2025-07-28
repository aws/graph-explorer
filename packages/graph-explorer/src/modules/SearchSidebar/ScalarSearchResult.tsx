import { Scalar } from "@/core";
import { cn, MISSING_DISPLAY_VALUE } from "@/utils";
import {
  BanIcon,
  CalendarIcon,
  CircleCheckIcon,
  CircleIcon,
  HashIcon,
  QuoteIcon,
} from "lucide-react";
import { ComponentPropsWithoutRef } from "react";

function getDisplayValue(scalar: Scalar) {
  switch (scalar.type) {
    case "string":
      return scalar.value;
    case "number":
      return new Intl.NumberFormat().format(scalar.value);
    case "boolean":
      return String(scalar.value);
    case "date":
      return new Intl.DateTimeFormat().format(scalar.value);
    case "null":
      return MISSING_DISPLAY_VALUE;
  }
}

function getIcon(scalar: Scalar) {
  switch (scalar.type) {
    case "string":
      return <QuoteIcon className="size-5" />;
    case "number":
      return <HashIcon className="size-5" />;
    case "boolean":
      return scalar.value ? (
        <CircleCheckIcon className="size-5" />
      ) : (
        <CircleIcon className="size-5" />
      );
    case "date":
      return <CalendarIcon className="size-5" />;
    case "null":
      return <BanIcon className="size-5" />;
  }
}

export function ScalarSearchResult({
  scalar,
  resultsHaveExpandableRows,
}: {
  scalar: Scalar;
  resultsHaveExpandableRows: boolean;
}) {
  const displayValue = getDisplayValue(scalar);
  const Icon = getIcon(scalar);

  return (
    <div
      className={cn(
        "bg-background-default w-full overflow-hidden transition-all"
      )}
    >
      <div className="flex w-full flex-row items-center gap-2 p-3 text-left ring-0">
        <div className="flex grow flex-row items-center gap-2">
          <div
            className={cn(resultsHaveExpandableRows ? "invisible" : "hidden")}
          >
            {/* Just here to align with node & edge results. This is never visible. */}
            <div className="size-5" />
          </div>
          <ScalarSymbol>{Icon}</ScalarSymbol>
          <div className="inline-block text-pretty text-base leading-snug [word-break:break-word]">
            <div className="font-bold">{displayValue}</div>
            <div className="text-text-secondary/90 line-clamp-2">
              Scalar value
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export function ScalarSymbol({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "text-primary-main bg-primary-main/20 grid size-[36px] shrink-0 place-content-center rounded-lg p-2 text-[2em]",
        className
      )}
      {...props}
    />
  );
}
