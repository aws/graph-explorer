import { useAtomValue } from "jotai";
import { SaveIcon } from "lucide-react";

import { Button } from "@/components";
import {
  edgesAtom,
  graphViewLayoutAlgorithmAtom,
  nodesAtom,
  useConfiguration,
  useExplorer,
} from "@/core";
import { saveFile, toJsonFileData } from "@/utils/fileData";

import { createDefaultFileName, createExportedGraph } from "./exportedGraph";

export function ExportGraphButton() {
  const exportGraph = useExportGraph();

  return (
    <Button
      tooltip="Save graph to file"
      variant="ghost"
      size="icon"
      onClick={() => exportGraph()}
    >
      <SaveIcon />
    </Button>
  );
}

export function useExportGraph() {
  const vertexIds = useAtomValue(nodesAtom).keys().toArray();
  const edgeIds = useAtomValue(edgesAtom).keys().toArray();
  const connection = useExplorer().connection;
  const config = useConfiguration();
  const layout = useAtomValue(graphViewLayoutAlgorithmAtom);

  const exportGraph = async () => {
    const fileName = createDefaultFileName(
      config?.displayLabel ?? "Connection",
    );
    const exportData = createExportedGraph(
      vertexIds,
      edgeIds,
      connection,
      layout,
    );
    const fileToSave = toJsonFileData(exportData);
    await saveFile(fileToSave, fileName);
  };

  return exportGraph;
}
