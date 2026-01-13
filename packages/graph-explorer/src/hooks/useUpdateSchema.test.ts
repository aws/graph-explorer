import {
  createRandomSchema,
  createRandomSchemaResponse,
  createRandomVertexType,
  renderHookWithJotai,
} from "@/utils/testing";
import { createRandomDate, createRandomInteger } from "@shared/utils/testing";
import useUpdateSchema from "./useUpdateSchema";
import { act } from "react";
import {
  activeConfigurationAtom,
  createNewConfigurationId,
  schemaAtom,
  type SchemaStorageModel,
} from "@/core";
import { useAtomValue } from "jotai";

describe("useUpdateSchema", () => {
  describe("setSyncFailure", () => {
    it("should do nothing if no schema exists", () => {
      const { result } = renderHookWithJotai(useTestSetup);
      act(() => result.current.setSyncFailure());
      expect(result.current.schemas).toHaveLength(0);
    });

    it("should update existing schema", () => {
      const configId = createNewConfigurationId();
      const existingSchema = createRandomSchema();
      const { result } = renderHookWithJotai(useTestSetup, store => {
        store.set(activeConfigurationAtom, configId);
        store.set(schemaAtom, new Map([[configId, existingSchema]]));
      });
      act(() => result.current.setSyncFailure());

      const schema = result.current.schemas.get(configId);
      expect(schema).toEqual({
        ...existingSchema,
        lastSyncFail: true,
      } satisfies SchemaStorageModel);
    });
  });

  describe("replaceSchema", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(createRandomDate());
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should set schema when none set", () => {
      const configId = createNewConfigurationId();
      const schemaResponse = createRandomSchemaResponse();

      const { result } = renderHookWithJotai(useTestSetup, store => {
        store.set(activeConfigurationAtom, configId);
      });

      act(() => result.current.replaceSchema(schemaResponse));

      const schema = result.current.schemas.get(configId);
      expect(schema).toStrictEqual({
        ...schemaResponse,
        lastSyncFail: false,
        lastUpdate: vi.getMockedSystemTime()!,
        triedToSync: true,
      } satisfies SchemaStorageModel);
    });

    it("should update existing schema", () => {
      const configId = createNewConfigurationId();
      const existingSchema = createRandomSchema();
      const schemaResponse = createRandomSchemaResponse();

      const { result } = renderHookWithJotai(useTestSetup, store => {
        store.set(activeConfigurationAtom, configId);
        store.set(schemaAtom, new Map([[configId, existingSchema]]));
      });
      act(() => result.current.replaceSchema(schemaResponse));

      expect(result.current.schemas.get(configId)).toEqual({
        ...schemaResponse,
        lastSyncFail: false,
        lastUpdate: vi.getMockedSystemTime()!,
        triedToSync: true,
      } satisfies SchemaStorageModel);
    });
  });

  describe("updateVertexTotal", () => {
    it("should do nothing if no schema exists", () => {
      const configId = createNewConfigurationId();
      const vertexType = createRandomVertexType();
      const vertexTotal = createRandomInteger();

      const { result } = renderHookWithJotai(useTestSetup, store => {
        store.set(activeConfigurationAtom, configId);
      });

      act(() => result.current.updateVertexTotal(vertexType, vertexTotal));

      expect(result.current.schemas).toHaveLength(0);
    });

    it("should update total on given vertex type", () => {
      const configId = createNewConfigurationId();
      const vertexType = createRandomVertexType();
      const vertexTotal = createRandomInteger();
      const existingSchema = createRandomSchema();
      existingSchema.vertices[0].type = vertexType;

      const { result } = renderHookWithJotai(useTestSetup, store => {
        store.set(activeConfigurationAtom, configId);
        store.set(schemaAtom, new Map([[configId, existingSchema]]));
      });

      act(() => result.current.updateVertexTotal(vertexType, vertexTotal));

      const schema = result.current.schemas.get(configId)!;
      const vtConfig = schema.vertices.find(v => v.type === vertexType);
      expect(vtConfig?.total).toEqual(vertexTotal);
    });
  });
});

function useTestSetup() {
  const actions = useUpdateSchema();
  const schemas = useAtomValue(schemaAtom);
  return { schemas, ...actions };
}
