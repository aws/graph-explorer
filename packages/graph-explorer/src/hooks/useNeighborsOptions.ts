import { Vertex } from "../@types/entities";
import { useConfiguration } from "../core/ConfigurationProvider";
import useTextTransform from "./useTextTransform";
import { useQuery } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";
import { neighborsCountQuery } from "../connector/queries";
import { explorerSelector } from "../core/connector";
import { neighborsCountSelector } from "../core/StateProvider/entitiesSelector";
import { VertexTypeConfig } from "../core";
import { useEffect, useMemo } from "react";
import { useNotification } from "../components/NotificationProvider";
import { createDisplayError } from "../utils/createDisplayError";

export type NeighborsOptions = {
  options: Array<{
    label: string;
    value: string;
    isDisabled: boolean;
    config?: VertexTypeConfig;
    totalCount: number;
    addedCount: number;
    collapsedCount: number;
  }>;
  totalCount: number;
  addedCount: number;
  collapsedCount: number;
};

export default function useNeighborsOptions(vertex: Vertex) {
  const config = useConfiguration();
  const textTransform = useTextTransform();
  const { enqueueNotification, clearNotification } = useNotification();

  const explorer = useRecoilValue(explorerSelector);
  const query = useQuery(neighborsCountQuery(vertex.data.id, explorer));

  const count = useRecoilValue(neighborsCountSelector(query.data));

  const result: NeighborsOptions | undefined = useMemo(() => {
    const result = count && {
      totalCount: count.totalCount,
      addedCount: count.addedCount,
      collapsedCount: count.collapsedCount,
      options: Array.from(count.countsByType)
        .map(([type, typeCounts]) => {
          const vConfig = config?.getVertexTypeConfig(type);

          return {
            label: vConfig?.displayLabel || textTransform(type),
            value: type,
            isDisabled: typeCounts.collapsedCount <= 0,
            config: vConfig,
            ...typeCounts,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    };
    return result;
  }, [config, count, textTransform]);

  // Show an toast message on error
  useEffect(() => {
    if (!query.isError) {
      return;
    }

    const displayError = createDisplayError(query.error);
    const notificationId = enqueueNotification({
      type: "error",
      ...displayError,
    });
    return () => clearNotification(notificationId);
  }, [clearNotification, enqueueNotification, query.error, query.isError]);

  return {
    ...query,
    data: result,
  };
}
