import { useMemo, useState } from "react";
import { AdvancedList } from "../../components";
import { useConfiguration } from "../../core";

const GeneratedPrefixes = () => {
  const config = useConfiguration();
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    return (
      config?.schema?.prefixes
        ?.filter(prefixConfig => prefixConfig.__inferred === true)
        .map(prefixConfig => {
          return {
            id: prefixConfig.prefix,
            title: `${prefixConfig.prefix} ${prefixConfig.uri}`,
            titleComponent: prefixConfig.prefix,
            subtitle: prefixConfig.uri,
          };
        })
        .sort((a, b) => a.title.localeCompare(b.title)) || []
    );
  }, [config?.schema?.prefixes]);

  return (
    <AdvancedList
      searchPlaceholder={"Search for prefixes or URIs"}
      search={search}
      onSearch={setSearch}
      items={items}
      emptyState={{
        noElementsTitle: "No Prefixes",
        noElementsSubtitle: "No stored Prefixes in this list",
        noSearchResultsTitle: "No Prefixes",
      }}
    />
  );
};

export default GeneratedPrefixes;
