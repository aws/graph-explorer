import { useMemo, useState } from "react";
import { AdvancedList, NamespaceIcon, PanelEmptyState } from "../../components";
import { useConfiguration, useWithTheme } from "../../core";
import defaultStyles from "./NsType.styles";

export type GeneratedPrefixesProps = {
  classNamePrefix?: string;
};

const GeneratedPrefixes = ({
  classNamePrefix = "ft",
}: GeneratedPrefixesProps) => {
  const styleWithTheme = useWithTheme();
  const config = useConfiguration();
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    return (
      config?.schema?.prefixes
        ?.filter(
          prefixConfig =>
            prefixConfig.__inferred === true &&
            prefixConfig.__matches &&
            prefixConfig.__matches.size > 1
        )
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
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      {items.length === 0 && (
        <PanelEmptyState
          title={"No Namespaces"}
          subtitle={"No automatically generated Namespaces"}
          icon={<NamespaceIcon />}
        />
      )}
      {items.length > 0 && (
        <AdvancedList
          searchPlaceholder={"Search for Namespaces or URIs"}
          search={search}
          onSearch={setSearch}
          items={items}
          emptyState={{
            noSearchResultsTitle: "No Namespaces",
          }}
        />
      )}
    </div>
  );
};

export default GeneratedPrefixes;
