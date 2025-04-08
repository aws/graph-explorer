import {
  MappedQueryResults,
  toMappedQueryResults,
} from "@/connector/useGEFetchTypes";
import { RawValue, rdfTypeUri } from "../types";
import { createEdge, createVertex } from "@/core";
import { createRdfEdgeId } from "../createRdfEdgeId";

export type RawOneHopNeighborsResponse = {
  results: {
    bindings: Array<{
      subject: RawValue;
      p: RawValue;
      value: RawValue;
    }>;
  };
};
type Bindings = RawOneHopNeighborsResponse["results"]["bindings"];

type DraftRdfNode = {
  uri: string;
  classes?: string[];
  isBlankNode?: boolean;
  attributes?: { predicate: string; value: string | number }[];
};

type DraftRdfEdge = {
  uri: string;
  source?: string;
  sourceClasses?: string[];
  target?: string;
  targetClasses?: string[];
};

export function mapToResults(bindings: Bindings): MappedQueryResults {
  // Get types map
  const typesMap = getTypesMap(bindings);

  // Get node related triples
  const drafts = bindings
    .values()
    .filter(triple => triple.p.value !== rdfTypeUri)
    .reduce((draftsMap, current) => {
      const updated = new Map(draftsMap);
      const uri = current.subject.value;
      const classes = typesMap.get(uri);
      const isBlankNode = current.subject.type === "bnode";
      const attribute =
        current.value.type === "literal"
          ? {
              predicate: current.p.value,
              value:
                current.value.datatype ===
                "http://www.w3.org/2001/XMLSchema#integer"
                  ? Number(current.value.value)
                  : current.value.value,
            }
          : null;

      const existingDraft = updated.get(uri);

      const draft: DraftRdfNode = {
        ...existingDraft,
        uri,
        classes,
        isBlankNode,
        attributes: [
          ...(existingDraft?.attributes ?? []),
          ...(attribute ? [attribute] : []),
        ],
      };

      updated.set(uri, draft);
      return updated;
    }, new Map<string, DraftRdfNode>());

  const vertices = drafts
    .values()
    .map(draft => {
      if (!draft.classes?.length) {
        return null;
      }
      const attributes: Record<string, string | number> = {};
      for (const attribute of draft.attributes ?? []) {
        attributes[attribute.predicate] = attribute.value;
      }
      return createVertex({
        id: draft.uri,
        types: draft.classes,
        isBlankNode: draft.isBlankNode,
        attributes: attributes,
      });
    })
    .filter(raw => raw != null)
    .toArray();

  // Get edge related triples
  const edges = bindings
    .values()
    .filter(
      triple =>
        triple.p.value !== rdfTypeUri &&
        (triple.subject.type === "uri" || triple.subject.type === "bnode") &&
        (triple.value.type === "uri" || triple.value.type === "bnode")
    )
    .map(
      triple =>
        ({
          uri: triple.p.value,
          source: triple.subject.value,
          target: triple.value.value,
          sourceClasses: typesMap.get(triple.subject.value),
          targetClasses: typesMap.get(triple.value.value),
        }) satisfies DraftRdfEdge
    )
    .map(draft => {
      if (!draft.sourceClasses?.length || !draft.targetClasses?.length) {
        return null;
      }
      return createEdge({
        id: createRdfEdgeId(draft.source, draft.uri, draft.target),
        source: createVertex({
          id: draft.source,
          types: draft.sourceClasses,
        }),
        target: createVertex({
          id: draft.target,
          types: draft.targetClasses,
        }),
        type: draft.uri,
        attributes: {},
      });
    })
    .filter(edge => edge != null)
    .toArray();

  return toMappedQueryResults({ vertices, edges });
}

function getTypesMap(bindings: Bindings) {
  const typesMap = Map.groupBy(
    bindings.filter(item => item.p.value === rdfTypeUri),
    item => item.subject.value
  );

  return new Map(
    typesMap
      .entries()
      .map(([key, value]) => [key, value.map(v => v.value.value)])
  );
}
