import {
  SearchResult,
  SearchResultAttribute,
  SearchResultAttributeName,
  SearchResultAttributeValue,
  SearchResultSubtitle,
  SearchResultSymbol,
  SearchResultTitle,
} from "@/components";
import {
  createTypedValue,
  getDisplayValueForScalar,
  ResultScalar,
} from "@/core";
import {
  BanIcon,
  CalendarIcon,
  CircleCheckIcon,
  CircleIcon,
  HashIcon,
  QuoteIcon,
} from "lucide-react";

function getIcon(scalar: ResultScalar) {
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

export function ScalarSearchResult({
  scalar,
  level,
}: {
  scalar: ResultScalar;
  level: number;
}) {
  const Icon = getIcon(scalar);
  const title = scalar.name;
  const subtitle = getDisplayValueForScalar(scalar.value);

  if (level > 0) {
    return (
      <SearchResultAttribute level={level}>
        {title && (
          <SearchResultAttributeName>{title}</SearchResultAttributeName>
        )}
        <SearchResultAttributeValue>{subtitle}</SearchResultAttributeValue>
      </SearchResultAttribute>
    );
  }

  return (
    <SearchResult
      level={level}
      className="flex w-full flex-row items-center gap-2 p-3"
    >
      <SearchResultSymbol className="text-primary-main bg-primary-main/20 rounded-lg">
        {Icon}
      </SearchResultSymbol>
      <div>
        {title && <SearchResultTitle>{title}</SearchResultTitle>}
        <SearchResultSubtitle className="line-clamp-none">
          {subtitle}
        </SearchResultSubtitle>
      </div>
    </SearchResult>
  );
}
