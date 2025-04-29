import { useCallback } from "react";
import { SaveIcon } from "lucide-react";
import { nodesAtom, edgesAtom, useExplorer, useConfiguration } from "@/core";
import { saveFile, toJsonFileData } from "@/utils/fileData";
import { PanelHeaderActionButton } from "@/components";
import { createDefaultFileName, createExportedGraph } from "./exportedGraph";
import { useAtomValue } from "jotai";

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

  const exportGraph = useCallback(async () => {
    const fileName = createDefaultFileName(
      config?.displayLabel ?? "Connection"
    );
    const exportData = createExportedGraph(vertexIds, edgeIds, connection);
    const fileToSave = toJsonFileData(exportData);
    await saveFile(fileToSave, fileName);
  }, [config?.displayLabel, connection, vertexIds, edgeIds]);

  return exportGraph;
}
