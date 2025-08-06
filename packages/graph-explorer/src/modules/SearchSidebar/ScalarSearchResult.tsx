import {
  SearchResult,
  SearchResultSubtitle,
  SearchResultSymbol,
  SearchResultTitle,
} from "@/components";
import { createTypedValue, getDisplayValueForScalar, Scalar } from "@/core";
import {
  BanIcon,
  CalendarIcon,
  CircleCheckIcon,
  CircleIcon,
  HashIcon,
  QuoteIcon,
} from "lucide-react";

function getIcon(scalar: Scalar) {
  const typedValue = createTypedValue(scalar.value);
  switch (typedValue.type) {
    case "string":
      return <QuoteIcon className="size-5" />;
    case "number":
      return <HashIcon className="size-5" />;
    case "boolean":
      return typedValue.value ? (
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

export function ScalarSearchResult({ scalar }: { scalar: Scalar }) {
  const Icon = getIcon(scalar);
  const title = scalar.name ?? "Scalar value";
  const subtitle = getDisplayValueForScalar(scalar.value);

  return (
    <SearchResult className="flex w-full flex-row items-center gap-2 p-3">
      <SearchResultSymbol className="text-primary-main bg-primary-main/20 rounded-lg">
        {Icon}
      </SearchResultSymbol>
      <div>
        <SearchResultTitle>{title}</SearchResultTitle>
        <SearchResultSubtitle className="line-clamp-none">
          {subtitle}
        </SearchResultSubtitle>
      </div>
    </SearchResult>
  );
}
