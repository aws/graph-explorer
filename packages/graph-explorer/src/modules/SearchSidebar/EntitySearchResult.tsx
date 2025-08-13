import { PatchedResultEntity } from "@/core";
import { VertexSearchResult } from "./VertexSearchResult";
import { EdgeSearchResult } from "./EdgeSearchResult";
import { ScalarSearchResult } from "./ScalarSearchResult";

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
      return <ScalarSearchResult scalar={entity} />;
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
  }
}
