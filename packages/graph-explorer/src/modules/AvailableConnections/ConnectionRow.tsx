import { DatabaseIcon } from "lucide-react";

import type { RawConfiguration } from "@/core";

import { ListRowContent, ListRowSubtitle, ListRowTitle } from "@/components";
import { isDirectConnection } from "@/core/StateProvider/configuration";
import useActivateConnection from "@/core/StateProvider/useActivateConnection";
import { useTranslations } from "@/hooks";
import { LABELS } from "@/utils/constants";

function ConnectionRow({
  connection,
  isSelected,
  isDisabled,
}: {
  connection: RawConfiguration;
  isSelected: boolean;
  isDisabled: boolean;
}) {
  const t = useTranslations();
  const activateConnection = useActivateConnection();
  const setActiveConfig = () => activateConnection(connection.id);

  const dbUrl = connection.connection?.graphDbUrl || null;
  const isDirect =
    connection.connection != null && isDirectConnection(connection.connection);

  const graphType = t(
    "query-language",
    connection.connection?.queryEngine || "gremlin",
  );

  return (
    <div
      onClick={setActiveConfig}
      className="@container flex flex-row items-center gap-4 px-6 py-4 hover:cursor-pointer"
    >
      <DatabaseIcon className="text-primary hidden size-8 shrink-0 @md:block" />
      <ListRowContent>
        <ListRowTitle className="inline-flex items-center gap-1">
          {connection.displayLabel || connection.id}
        </ListRowTitle>
        <ListRowSubtitle>
          <span className="">{graphType}</span>
          {/* Ahead of the URL so a long URL can't clamp it away */}
          {isDirect ? <span> &bull; {LABELS.DIRECT_CONNECTION}</span> : null}
          {dbUrl ? <span> &bull; {dbUrl}</span> : null}
        </ListRowSubtitle>
      </ListRowContent>
      <input
        type="radio"
        checked={isSelected}
        onChange={setActiveConfig}
        disabled={isDisabled}
        className="hidden"
      />
    </div>
  );
}

export { ConnectionRow };
