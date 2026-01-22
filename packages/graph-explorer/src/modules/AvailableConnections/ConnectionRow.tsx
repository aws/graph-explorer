import { useAtomCallback } from "jotai/utils";
import { DatabaseIcon } from "lucide-react";
import { useCallback } from "react";

import { ListRowContent, ListRowSubtitle, ListRowTitle } from "@/components";
import {
  activeConfigurationAtom,
  type ConfigurationId,
  type RawConfiguration,
} from "@/core";
import useResetState from "@/core/StateProvider/useResetState";
import { useTranslations } from "@/hooks";
import { logger } from "@/utils";

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
  const setActiveConfig = useSetActiveConfigCallback(connection.id);

  const dbUrl = connection.connection
    ? connection.connection.proxyConnection
      ? connection.connection.graphDbUrl
      : connection.connection.url
    : null;

  const graphType = t(
    "query-language",
    connection.connection?.queryEngine || "gremlin",
  );

  return (
    <div
      onClick={setActiveConfig}
      className="@container flex flex-row items-center gap-4 px-6 py-4 hover:cursor-pointer"
    >
      <DatabaseIcon className="text-primary-main hidden size-8 shrink-0 @md:block" />
      <ListRowContent>
        <ListRowTitle className="inline-flex items-center gap-1">
          {connection.displayLabel || connection.id}
        </ListRowTitle>
        <ListRowSubtitle>
          <span className="">{graphType}</span>
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

function useSetActiveConfigCallback(configId: ConfigurationId) {
  const resetState = useResetState();
  return useAtomCallback(
    useCallback(
      (_get, set) => {
        logger.debug("Setting active connection to", configId);
        set(activeConfigurationAtom, configId);
        resetState();
      },
      [configId, resetState],
    ),
  );
}

export { ConnectionRow };
