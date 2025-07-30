import {
  SearchResult,
  SearchResultSubtitle,
  SearchResultTitle,
} from "@/components";
import { getDisplayValueForScalar, Scalar } from "@/core";
import { cn } from "@/utils";
import {
  BanIcon,
  CalendarIcon,
  CircleCheckIcon,
  CircleIcon,
  HashIcon,
  QuoteIcon,
} from "lucide-react";
import { ComponentPropsWithoutRef } from "react";

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
}: {
  scalar: Scalar;
  resultsHaveExpandableRows: boolean;
}) {
  const Icon = getIcon(scalar);
  const title = scalar.name ?? "Scalar value";
  const subtitle = getDisplayValueForScalar(scalar);

  return (
    <SearchResult className="flex w-full flex-row items-center gap-2 p-3">
      <ScalarSymbol>{Icon}</ScalarSymbol>
      <div>
        <SearchResultTitle>{title}</SearchResultTitle>
        <SearchResultSubtitle className="line-clamp-none">
          {subtitle}
        </SearchResultSubtitle>
      </div>
    </SearchResult>
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
