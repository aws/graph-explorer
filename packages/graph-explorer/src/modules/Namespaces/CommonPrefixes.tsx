import { useState } from "react";
import { AdvancedList } from "@/components";
import { useWithTheme } from "@/core";
import commonPrefixes from "@/utils/common-prefixes.json";
import defaultStyles from "./NsType.styles";

const COMMON_PREFIXES_ITEMS = Object.entries(commonPrefixes)
  .map(([prefix, uri]) => {
    return {
      id: prefix,
      title: `${prefix}-${uri}`,
      titleComponent: prefix,
      subtitle: uri,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

const CommonPrefixes = () => {
  const styleWithTheme = useWithTheme();
  const [search, setSearch] = useState("");

  return (
    <div className={styleWithTheme(defaultStyles)}>
      <AdvancedList
        searchPlaceholder="Search for Namespaces or URIs"
        search={search}
        onSearch={setSearch}
        items={COMMON_PREFIXES_ITEMS}
      />
    </div>
  );
};

export default CommonPrefixes;
