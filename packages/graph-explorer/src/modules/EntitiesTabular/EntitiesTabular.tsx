import { useState } from "react";
import {
  GridIcon,
  Panel,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelHeaderDivider,
  PanelTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import type { TabularInstance } from "@/components/Tabular";
import { ExportControl } from "@/components/Tabular";
import TabularControlsProvider from "@/components/Tabular/TabularControlsProvider";
import useTranslations from "@/hooks/useTranslations";
import { EdgesTabular, NodesTabular } from "./components";
import { useViewToggles } from "@/core";

enum TableId {
  edges = "edges",
  nodes = "nodes",
}

function EntitiesTabular() {
  const t = useTranslations();

  const [selectedTable, setSelectedTable] = useState<TableId>(TableId.nodes);
  // Store tabular instances to allow use external tabular controls in the header
  const [nodeInstance, setNodeInstance] = useState<TabularInstance<any> | null>(
    null
  );
  const [edgeInstance, setEdgeInstance] = useState<TabularInstance<any> | null>(
    null
  );
  const tableList = [
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
  ];

  const selectedTabularInstance =
    TableId.nodes === selectedTable ? nodeInstance : edgeInstance;

  return (
    <Panel>
      {nodeInstance && edgeInstance && selectedTabularInstance && (
        <TabularControlsProvider tabularInstance={selectedTabularInstance}>
          <PanelHeader>
            <PanelTitle>
              <GridIcon className="icon" />
              Table View
            </PanelTitle>
            <PanelHeaderActions>
              <Select
                aria-label="Table"
                value={selectedTable}
                onValueChange={tableId => {
                  setSelectedTable(tableId as TableId);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select an entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TableId.nodes}>
                    {t("entities-tabular.all-nodes")}
                  </SelectItem>
                  <SelectItem value={TableId.edges}>
                    {t("entities-tabular.all-edges")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="grow" />
              <ExportControl />
              <PanelHeaderDivider />
              <CloseButton />
            </PanelHeaderActions>
          </PanelHeader>
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
    </Panel>
  );
}

function CloseButton() {
  const { toggleTableVisibility } = useViewToggles();

  return <PanelHeaderCloseButton onClose={toggleTableVisibility} />;
}

export default EntitiesTabular;
