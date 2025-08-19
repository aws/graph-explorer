import { VertexSearchResult } from "./VertexSearchResult";
import { EdgeSearchResult } from "./EdgeSearchResult";
import { ScalarSearchResult } from "./ScalarSearchResult";
import { BundleSearchResult } from "./BundleSearchResult";
import {
  getDisplayValueForBundle,
  PatchedResultEntity,
} from "@/connector/entities";

export function EntitySearchResult({
  entity,
  level,
}: {
  entity: PatchedResultEntity;
  level: number;
}) {
  switch (entity.entityType) {
    case "vertex":
      return <VertexSearchResult vertex={entity} level={level} />;
    case "edge":
      return <EdgeSearchResult edge={entity} level={level} />;
    case "scalar":
      return <ScalarSearchResult scalar={entity} level={level} />;
    case "bundle":
      return <BundleSearchResult bundle={entity} level={level} />;
  }
}

export function createEntityKey(entity: PatchedResultEntity, level: number) {
  const commonPrefix =
    "name" in entity
      ? `${entity.entityType}:${level}:${entity.name}`
      : `${entity.entityType}:${level}`;

  switch (entity.entityType) {
    case "vertex":
    case "edge":
      return `${commonPrefix}:${entity.id}`;
    case "scalar":
      return `${commonPrefix}:${String(entity.value)}`;
    case "bundle":
      return `${commonPrefix}:${getDisplayValueForBundle(entity)}`;
  }
}
