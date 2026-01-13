import { useAtomValue } from "jotai";
import { SaveIcon } from "lucide-react";

import { PanelHeaderActionButton } from "@/components";
import { edgesAtom, nodesAtom, useConfiguration, useExplorer } from "@/core";
import { saveFile, toJsonFileData } from "@/utils/fileData";

import { createDefaultFileName, createExportedGraph } from "./exportedGraph";

export function ExportGraphButton() {
  const exportGraph = useExportGraph();

  return (
    <PanelHeaderActionButton
      icon={<SaveIcon />}
      label="Save graph to file"
      onActionClick={() => exportGraph()}
    />
  );
}

export function useExportGraph() {
  const vertexIds = useAtomValue(nodesAtom).keys().toArray();
  const edgeIds = useAtomValue(edgesAtom).keys().toArray();
  const connection = useExplorer().connection;
  const config = useConfiguration();

  const exportGraph = async () => {
    const fileName = createDefaultFileName(
      config?.displayLabel ?? "Connection",
    );
    const exportData = createExportedGraph(vertexIds, edgeIds, connection);
    const fileToSave = toJsonFileData(exportData);
    await saveFile(fileToSave, fileName);
  };

  return exportGraph;
}
