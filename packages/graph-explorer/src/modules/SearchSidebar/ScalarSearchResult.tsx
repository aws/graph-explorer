import { ScalarValue } from "@/connector";
import { cn } from "@/utils";
import {
  CalendarIcon,
  HashIcon,
  QuoteIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "lucide-react";
import { ComponentPropsWithoutRef } from "react";

function getDisplayValue(scalar: ScalarValue) {
  if (typeof scalar === "string") {
    return scalar;
  } else if (typeof scalar === "number") {
    return new Intl.NumberFormat().format(scalar);
  } else if (typeof scalar === "boolean") {
    return String(scalar);
  } else if (scalar instanceof Date) {
    return new Intl.DateTimeFormat().format(scalar);
  }
}

function getIcon(scalar: ScalarValue) {
  if (typeof scalar === "string") {
    return <QuoteIcon className="size-5" />;
  } else if (typeof scalar === "number") {
    return <HashIcon className="size-5" />;
  } else if (typeof scalar === "boolean") {
    return scalar ? (
      <ToggleRightIcon className="size-5" />
    ) : (
      <ToggleLeftIcon className="size-5" />
    );
  } else if (scalar instanceof Date) {
    return <CalendarIcon className="size-5" />;
  }
}

export function ScalarSearchResult({ scalar }: { scalar: ScalarValue }) {
  const displayValue = getDisplayValue(scalar);
  const Icon = getIcon(scalar);

  return (
    <div
      className={cn(
        "bg-background-default w-full overflow-hidden transition-all"
      )}
    >
      <div className="flex w-full flex-row items-center gap-2 p-3 text-left ring-0">
        <div className="flex grow flex-row items-center gap-3">
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
