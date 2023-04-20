import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useNotification } from "../../components/NotificationProvider";
import { KeywordSearchResponse } from "../../connector/AbstractConnector";
import { useConfiguration } from "../../core";
import useConnector from "../../core/ConnectorProvider/useConnector";
import useDebounceValue from "../../hooks/useDebounceValue";
import usePrefixesUpdater from "../../hooks/usePrefixesUpdater";
import useTextTransform from "../../hooks/useTextTransform";

export interface PromiseWithCancel<T> extends Promise<T> {
  cancel?: () => void;
}
const usePatientSearch = ({ isOpen }: { isOpen: boolean }) => {
  const config = useConfiguration();
  const connector = useConnector();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);
  //**const [selectedVertexType, setSelectedVertexType] = useState("__all");
  const [selectedAttribute, setSelectedAttribute] = useState("__all");
  const textTransform = useTextTransform();

  //**
  const vertexOptions = [
    { label: "Patients", value: "Patient" },
  ];
  /*const vertexOptions = useMemo(() => {
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
  */
// -------------APOTHECA CHANGES TO ALLOW FOR VALUE TO BE A NUMBER------------

//** 
/*  const onVertexOptionChange = useCallback((value: string | string[] |number) => {
    if (typeof value=== 'string') {
      setSelectedVertexType(value as string);
    }
    if (typeof value ==='number'){
      setSelectedVertexType(value.toString() as string);
    }
    
  }, []);
*/
  // -------------APOTHECA CHANGES TO ALLOW FOR VALUE TO BE A NUMBER------------
  const onAttributeOptionChange = useCallback((value: string | string[]| number) => {
    if (typeof value=== 'string') {
      setSelectedAttribute(value as string);
    }
    if (typeof value ==='number'){
      setSelectedAttribute(value.toString() as string);
    }
  }, []);

  const searchableAttributes = useMemo(() => {
    /*
    if (selectedVertexType !== "__all") {
      return (
        config?.getVertexTypeSearchableAttributes(selectedVertexType) || []
      );
    }
*/
    return (
      config?.schema?.vertices.flatMap(vertex =>
        config?.getVertexTypeSearchableAttributes(vertex.type)
      ) || []
    );
  }, [config, 
    //**selectedVertexType
  ]);

//** 
/*
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

      return `Search by Patient ${attributes || searchById}...`;
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
  */
  //const searchPlaceholder = "Search for patients by name, ID, or other attributes...";
  const searchPlaceholder = useMemo(() => {
    const attributes = uniq(
      searchableAttributes.map(
        attr => attr.displayLabel || textTransform(attr.name)
      )
    )
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 5)
      .join(", ");

    return `Search by Patient ${attributes}...`;

  },
  [   config,
    searchableAttributes,
    textTransform,
    vertexOptions,])
  const attributesOptions = useMemo(() => {
    /*
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
*/
    const attributes = uniqBy(
      config
        ?.getVertexTypeSearchableAttributes('Patient')
        .map(attr => ({
          value: attr.name,
          label: attr.displayLabel || textTransform(attr.name),
        })),
      op => op.value
    );
    return [{ label: "All", value: "__all" }, ...attributes];
  }, [config, searchableAttributes, 
    //**selectedVertexType, 
    textTransform]);

  const { enqueueNotification } = useNotification();
  const [isMount, setMount] = useState(false);
//**
/*  
  const vertexTypes =
    selectedVertexType === "__all" ? config?.vertexTypes : [selectedVertexType];
    */
  const vertexTypes = ['Patient']
  const searchByAttributes =
    selectedAttribute === "__all"
      ? uniq(searchableAttributes.map(attr => attr.name))
      : [selectedAttribute];

  const updatePrefixes = usePrefixesUpdater();
  const { data, isFetching } = useQuery(
    [
      "keyword-search",
      debouncedSearchTerm,
      vertexTypes,
      searchByAttributes,
      isMount,
      isOpen,
    ],
    () => {
      if (!isOpen || !config) {
        return;
      }

      const controller = new AbortController();
      const promise = connector.explorer?.keywordSearch(
        {
          searchTerm: debouncedSearchTerm,
          vertexTypes,
          searchByAttributes,
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

        updatePrefixes(response.vertices.map(v => v.data.id));
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

  if (isOpen && !isMount) {
    setMount(true);
  }

  //**
  /* 
  useEffect(() => {
    setSelectedAttribute("__all");
  }, [selectedVertexType]);
  */
  return {
    isFetching,
    debouncedSearchTerm,
    //**onSearchTermChange,
    //**onVertexOptionChange,
    searchPlaceholder,
    searchTerm,
    //**selectedVertexType,
    vertexOptions,
    selectedAttribute,
    attributesOptions,
    onAttributeOptionChange,
    searchResults: data?.vertices || [],
  };
};

export default usePatientSearch;
