import { useState } from "react";
import { AdvancedList } from "../../components";
import commonPrefixes from "../../utils/common-prefixes.json";

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
  const [search, setSearch] = useState("");

  return (
    <AdvancedList
      searchPlaceholder={"Search for prefixes or URIs"}
      search={search}
      onSearch={setSearch}
      items={COMMON_PREFIXES_ITEMS}
      emptyState={{
        noSearchResultsTitle: "No Prefixes",
      }}
    />
  );
};

export default CommonPrefixes;
