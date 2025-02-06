import { useCallback } from "react";
import { useRecoilValue } from "recoil";
import { SaveIcon } from "lucide-react";
import { nodesAtom, edgesAtom, useExplorer } from "@/core";
import { saveFile, toJsonFileData } from "@/utils/fileData";
import { PanelHeaderActionButton } from "@/components";
import { createExportedGraph } from "./exportedGraph";

export function ExportGraphButton() {
  const exportGraph = useExportGraph();

  return (
    <PanelHeaderActionButton
      icon={<SaveIcon />}
      label="Save graph to file"
      onActionClick={() => exportGraph("graph-export.json")}
    />
  );
}

export function useExportGraph() {
  const vertexIds = useRecoilValue(nodesAtom).keys().toArray();
  const edgeIds = useRecoilValue(edgesAtom).keys().toArray();
  const connection = useExplorer().connection;

  const exportGraph = useCallback(
    async (fileName: string) => {
      const exportData = createExportedGraph(vertexIds, edgeIds, connection);
      const fileToSave = toJsonFileData(exportData);
      await saveFile(fileToSave, fileName);
    },
    [connection, vertexIds, edgeIds]
  );

  return exportGraph;
}
