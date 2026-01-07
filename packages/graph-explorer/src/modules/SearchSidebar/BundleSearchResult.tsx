import { BracketsIcon } from "lucide-react";
import {
  CollapsibleContent,
  SearchResultCollapsible,
  SearchResultCollapsibleTrigger,
  SearchResultSubtitle,
  SearchResultSymbol,
  SearchResultTitle,
} from "@/components";
import { createEntityKey, EntitySearchResult } from "./EntitySearchResult";
import {
  getDisplayValueForBundle,
  type PatchedResultBundle,
} from "@/connector/entities";
import { useTextTransform } from "@/hooks";

export function BundleSearchResult({
  bundle,
  level = 0,
}: {
  bundle: PatchedResultBundle;
  level?: number;
}) {
  const textTransformer = useTextTransform();
  const title = bundle.name ? textTransformer(bundle.name) : bundle.name;
  const subtitle = getDisplayValueForBundle(bundle, textTransformer);

  return (
    <SearchResultCollapsible level={level}>
      <SearchResultCollapsibleTrigger>
        <SearchResultSymbol className="bg-primary-main/20 text-primary-main rounded-lg">
          <BracketsIcon className="size-5" />
        </SearchResultSymbol>
        <div>
          {title && <SearchResultTitle>{title}</SearchResultTitle>}
          <SearchResultSubtitle>{subtitle}</SearchResultSubtitle>
        </div>
      </SearchResultCollapsibleTrigger>
      <CollapsibleContent>
        <ul className="space-y-3 p-3">
          {bundle.values.map(entity => (
            <li key={createEntityKey(entity, level + 1)}>
              <EntitySearchResult entity={entity} level={level + 1} />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </SearchResultCollapsible>
  );
}
