import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useSetRecoilState } from "recoil";
import { useNotification } from "../../components/NotificationProvider";
import { KeywordSearchResponse } from "../../connector/AbstractConnector";
import { useConfiguration } from "../../core";
import useConnector from "../../core/ConnectorProvider/useConnector";
import { schemaAtom } from "../../core/StateProvider/schema";
import useDebounceValue from "../../hooks/useDebounceValue";
import useTextTransform from "../../hooks/useTextTransform";

export interface PromiseWithCancel<T> extends Promise<T> {
  cancel?: () => void;
}
const useKeywordSearch = ({ isOpen }: { isOpen: boolean }) => {
  const config = useConfiguration();
  const connector = useConnector();

  const setSchema = useSetRecoilState(schemaAtom);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);
  const [selectedVertexType, setSelectedVertexType] = useState("__all");
  const [selectedAttribute, setSelectedAttribtue] = useState("__all");
  const textTransform = useTextTransform();

  const vertexOptions = useMemo(() => {
    const vertexOps =
      config?.vertexTypes
        .map(vt => {
          const vtConfig = config?.getVertexTypeConfig(vt);
          return {
            label: textTransform(vtConfig?.displayLabel || vt),
            value: vt,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)) || [];

    return [{ label: "All", value: "__all" }, ...vertexOps];
  }, [config, textTransform]);

  const onSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const onVertexOptionChange = useCallback((value: string | string[]) => {
    setSelectedVertexType(value as string);
  }, []);

  const onAttributeOptionChange = useCallback((value: string | string[]) => {
    setSelectedAttribtue(value as string);
  }, []);

  const searchableAttributes = useMemo(() => {
    if (selectedVertexType !== "__all") {
      return (
        config?.getVertexTypeSearchableAttributes(selectedVertexType) || []
      );
    }

    return (
      config?.schema?.vertices.flatMap(vertex =>
        config?.getVertexTypeSearchableAttributes(vertex.type)
      ) || []
    );
  }, [config, selectedVertexType]);

  const searchPlaceholder = useMemo(() => {
    const searchById =
      config?.connection?.queryEngine === "sparql" ? "URI" : "Id";

    if (selectedVertexType === "__all") {
      const attributes = uniq(
        searchableAttributes.map(
          attr => attr.displayLabel || textTransform(attr.name)
        )
      )
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 5)
        .join(", ");

      return `Search by ${attributes || searchById}...`;
    }

    const attributes = uniq(
      config
        ?.getVertexTypeSearchableAttributes(selectedVertexType)
        .map(attr => attr.displayLabel || textTransform(attr.name))
    )
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 5)
      .join(", ");

    return `Search for ${
      vertexOptions.find(vt => vt.value === selectedVertexType)?.label
    } by ${attributes || searchById}`;
  }, [
    config,
    searchableAttributes,
    selectedVertexType,
    textTransform,
    vertexOptions,
  ]);

  const attributesOptions = useMemo(() => {
    if (selectedVertexType === "__all") {
      const attributes = uniqBy(
        searchableAttributes.map(attr => ({
          value: attr.name,
          label: attr.displayLabel || textTransform(attr.name),
        })),
        op => op.value
      );
      return [{ label: "All", value: "__all" }, ...attributes];
    }

    const attributes = uniqBy(
      config
        ?.getVertexTypeSearchableAttributes(selectedVertexType)
        .map(attr => ({
          value: attr.name,
          label: attr.displayLabel || textTransform(attr.name),
        })),
      op => op.value
    );
    return [{ label: "All", value: "__all" }, ...attributes];
  }, [config, searchableAttributes, selectedVertexType, textTransform]);

  const { enqueueNotification } = useNotification();
  const [isMount, setMount] = useState(false);
  const { data, isFetching } = useQuery(
    ["keyword-search", debouncedSearchTerm, selectedVertexType, isMount],
    () => {
      if (!isOpen || !config) {
        return;
      }

      const controller = new AbortController();
      const promise = connector.explorer?.keywordSearch(
        {
          searchTerm: debouncedSearchTerm,
          vertexTypes:
            selectedVertexType === "__all"
              ? config?.vertexTypes
              : [selectedVertexType],
          searchByAttributes:
            selectedAttribute === "__all"
              ? uniq(searchableAttributes.map(attr => attr.name))
              : [selectedAttribute],
          searchById: searchableAttributes.length === 0,
        },
        { abortSignal: controller.signal }
      ) as PromiseWithCancel<KeywordSearchResponse>;

      promise.cancel = () => {
        controller.abort();
      };

      return promise;
    },
    {
      enabled: !!config,
      onSuccess: response => {
        if (!response) {
          return;
        }

        if (response.prefixes?.length !== 0) {
          setSchema(prevSchemaMap => {
            if (!config?.id) {
              return prevSchemaMap;
            }

            const updatedSchema = new Map(prevSchemaMap);
            const schema = updatedSchema.get(config.id);
            updatedSchema.set(config.id, {
              // Update prefixes does not affect to sync last update date
              lastUpdate: schema?.lastUpdate,
              vertices: schema?.vertices || [],
              edges: schema?.edges || [],
              prefixes: [
                ...(schema?.prefixes || []),
                ...(response.prefixes || []),
              ],
            });
            return updatedSchema;
          });

          if (response.prefixes?.length) {
            enqueueNotification({
              title: "Prefixes updated",
              message:
                response.prefixes?.length === 1
                  ? "1 new prefix has been generated"
                  : `${response.prefixes?.length} new prefixes have been generated`,
              type: "success",
              stackable: true,
            });
          }
        }
      },
      onError: (e: Error) => {
        enqueueNotification({
          type: "error",
          title: "Something went wrong",
          message: e.message,
        });
      },
    }
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setMount(true);
  }, [isOpen]);

  useEffect(() => {
    setSelectedAttribtue("__all");
    setSearchTerm("");
  }, [selectedVertexType]);

  return {
    isFetching,
    debouncedSearchTerm,
    onSearchTermChange,
    onVertexOptionChange,
    searchPlaceholder,
    searchTerm,
    selectedVertexType,
    vertexOptions,
    selectedAttribute,
    attributesOptions,
    onAttributeOptionChange,
    searchResults: data?.vertices || [],
  };
};

export default useKeywordSearch;
