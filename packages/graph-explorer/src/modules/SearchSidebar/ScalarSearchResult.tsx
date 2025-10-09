import {
  SearchResultAttribute,
  SearchResultAttributeName,
  SearchResultAttributeValue,
} from "@/components";
import {
  type ResultScalar,
  getDisplayValueForScalar,
} from "@/connector/entities";
import { useTextTransform } from "@/hooks";

export function ScalarSearchResult({
  scalar,
  level,
}: {
  scalar: ResultScalar;
  level: number;
}) {
  const textTransformer = useTextTransform();
  const title = scalar.name;
  const subtitle = textTransformer(getDisplayValueForScalar(scalar.value));

  return (
    <SearchResultAttribute level={level} className="w-full">
      {title && <SearchResultAttributeName>{title}</SearchResultAttributeName>}
      <SearchResultAttributeValue>{subtitle}</SearchResultAttributeValue>
    </SearchResultAttribute>
  );
}
