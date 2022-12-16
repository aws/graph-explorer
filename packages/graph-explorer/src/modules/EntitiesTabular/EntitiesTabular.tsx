import { cx } from "@emotion/css";
import { useMemo, useState } from "react";
import { ModuleContainer } from "../../components";
import type { TabularInstance } from "../../components/Tabular";
import { ModuleContainerTabularHeader } from "../../components/Tabular";
import TabularControlsProvider from "../../components/Tabular/TabularControlsProvider";
import { useWithTheme, withClassNamePrefix } from "../../core";
import useTranslations from "../../hooks/useTranslations";
import { EdgesTabular, NodesTabular } from "./components";
import defaultStyles from "./EntitiesTabular.styles";

enum TableId {
  edges = "edges",
  nodes = "nodes",
}

const EntitiesTabular = () => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix("ft");
  const t = useTranslations();

  const [selectedTable, setSelectedTable] = useState<TableId>(TableId.nodes);
  // Store tabular instances to allow use external tabular controls in the header
  const [nodeInstance, setNodeInstance] = useState<TabularInstance<any> | null>(
    null
  );
  const [edgeInstance, setEdgeInstance] = useState<TabularInstance<any> | null>(
    null
  );
  const tableList = useMemo(
    () => [
      {
        id: TableId.nodes,
        component: (
          <NodesTabular
            ref={ref => {
              setNodeInstance(ref);
            }}
          />
        ),
      },
      {
        id: TableId.edges,
        component: (
          <EdgesTabular
            ref={ref => {
              setEdgeInstance(ref);
            }}
          />
        ),
      },
    ],
    []
  );

  const selectedTabularInstance =
    TableId.nodes === selectedTable ? nodeInstance : edgeInstance;

  return (
    <ModuleContainer
      classNamePrefix={"ft"}
      className={cx(
        styleWithTheme(defaultStyles("ft")),
        pfx("entities-tabular-module")
      )}
    >
      {nodeInstance && edgeInstance && selectedTabularInstance && (
        <TabularControlsProvider tabularInstance={selectedTabularInstance}>
          <ModuleContainerTabularHeader
            tables={[
              {
                value: TableId.nodes,
                label: t("entities-tabular.all-nodes"),
              },
              {
                value: TableId.edges,
                label: t("entities-tabular.all-edges"),
              },
            ]}
            selectedTable={selectedTable}
            onTableChange={tableId => {
              setSelectedTable(tableId as TableId);
            }}
          />
        </TabularControlsProvider>
      )}
      {tableList.map(table => (
        <div
          key={table.id}
          style={{
            overflow: "hidden",
            height: "100%",
            width: "100%",
            display: table.id === selectedTable ? "block" : "none",
          }}
        >
          {table.component}
        </div>
      ))}
    </ModuleContainer>
  );
};

export default EntitiesTabular;
