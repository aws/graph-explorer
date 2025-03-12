import React from "react";
import { useRecoilCallback } from "recoil";
import { DatabaseIcon } from "lucide-react";
import { ListRowContent, ListRowTitle, ListRowSubtitle } from "@/components";
import {
  activeConfigurationAtom,
  ConfigurationId,
  RawConfiguration,
} from "@/core";
import useResetState from "@/core/StateProvider/useResetState";
import { useTranslations } from "@/hooks";

const ConnectionRow = React.memo(
  ({
    connection,
    isSelected,
    isDisabled,
  }: {
    connection: RawConfiguration;
    isSelected: boolean;
    isDisabled: boolean;
  }) => {
    const t = useTranslations();
    const setActiveConfig = useSetActiveConfigCallback(connection.id);

    const dbUrl = connection.connection
      ? connection.connection.proxyConnection
        ? connection.connection.graphDbUrl
        : connection.connection.url
      : null;

    const graphType = t(
      "available-connections.graph-type",
      connection.connection?.queryEngine || "gremlin"
    );

    return (
      <div
        onClick={setActiveConfig}
        className="flex flex-row items-center gap-4 px-6 py-4 hover:cursor-pointer"
      >
        <DatabaseIcon className="text-primary-main @md:block hidden size-8 shrink-0" />
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
);

function useSetActiveConfigCallback(configId: ConfigurationId) {
  const resetState = useResetState();
  return useRecoilCallback(
    ({ set }) =>
      () => {
        set(activeConfigurationAtom, configId);
        resetState();
      },
    [configId, resetState]
  );
}

export { ConnectionRow };
