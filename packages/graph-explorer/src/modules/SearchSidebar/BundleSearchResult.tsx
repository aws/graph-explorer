import { PatchedResultBundle, getDisplayValueForBundle } from "@/core";
import { BracketsIcon } from "lucide-react";
import {
  CollapsibleContent,
  CollapsibleTrigger,
  SearchResultCollapsible,
  SearchResultExpandChevron,
  SearchResultSubtitle,
  SearchResultSymbol,
  SearchResultTitle,
} from "@/components";
import { createEntityKey, EntitySearchResult } from "./EntitySearchResult";

export function BundleSearchResult({
  bundle,
  level = 0,
}: {
  bundle: PatchedResultBundle;
  level?: number;
}) {
  const title = bundle.name;
  const subtitle = getDisplayValueForBundle(bundle);

  return (
    <SearchResultCollapsible level={level}>
      <CollapsibleTrigger asChild>
        <div className="flex w-full flex-row items-center gap-2 p-3 text-left hover:cursor-pointer">
          <SearchResultExpandChevron />
          <SearchResultSymbol className="text-primary-main bg-primary-main/20 rounded-lg">
            <BracketsIcon className="size-5" />
          </SearchResultSymbol>
          <div>
            {title && <SearchResultTitle>{title}</SearchResultTitle>}
            <SearchResultSubtitle>{subtitle}</SearchResultSubtitle>
          </div>
        </div>
      </CollapsibleTrigger>
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
