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
    <SearchResultAttribute level={level} className="w-full">
      {title && <SearchResultAttributeName>{title}</SearchResultAttributeName>}
      <SearchResultAttributeValue>{subtitle}</SearchResultAttributeValue>
    </SearchResultAttribute>
  );
}
