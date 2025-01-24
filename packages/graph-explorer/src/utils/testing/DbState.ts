import { Vertex } from "@/core";
import {
  activeConfigurationAtom,
  configurationAtom,
  nodesAtom,
  RawConfiguration,
  Schema,
  toNodeMap,
} from "@/core";
import {
  extractConfigFromEntity,
  schemaAtom,
} from "@/core/StateProvider/schema";
import { MutableSnapshot } from "recoil";
import { createRandomSchema, createRandomRawConfiguration } from "./randomData";

/**
 * Helps build up the state of the recoil database with common data.
 */
export class DbState {
  activeSchema: Schema;
  activeConfig: RawConfiguration;
  vertices: Vertex[] = [];

  constructor() {
    this.activeSchema = createRandomSchema();

    const config = createRandomRawConfiguration();
    config.schema = this.activeSchema;
    this.activeConfig = config;
  }

  /** Adds the vertex to the graph and updates the schema to include the type config. */
  addVertexToGraph(vertex: Vertex) {
    this.vertices.push(vertex);
    this.activeSchema.vertices.push(extractConfigFromEntity(vertex));
  }

  /** Applies the state to the given Recoil snapshot. */
  applyTo(snapshot: MutableSnapshot) {
    snapshot.set(
      configurationAtom,
      new Map([[this.activeConfig.id, this.activeConfig]])
    );
    snapshot.set(
      schemaAtom,
      new Map([[this.activeConfig.id, this.activeSchema]])
    );
    snapshot.set(activeConfigurationAtom, this.activeConfig.id);
    snapshot.set(nodesAtom, toNodeMap(this.vertices));
  }
}
