import {
  SearchResultAttribute,
  SearchResultAttributeName,
  SearchResultAttributeValue,
} from "@/components";
import { ResultScalar, getDisplayValueForScalar } from "@/connector/entities";

export function ScalarSearchResult({
  scalar,
  level,
}: {
  scalar: ResultScalar;
  level: number;
}) {
  const title = scalar.name;
  const subtitle = getDisplayValueForScalar(scalar.value);

  return (
    <SearchResultAttribute level={level} className="items-center">
      <div className="grid grid-cols-[auto_1fr] items-center gap-3">
        {title && (
          <SearchResultAttributeName>{title}</SearchResultAttributeName>
        )}
      </div>
      <SearchResultAttributeValue>{subtitle}</SearchResultAttributeValue>
    </SearchResultAttribute>
  );
}
