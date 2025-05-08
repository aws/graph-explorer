import {
  createRandomSchema,
  createRandomSchemaResponse,
  renderHookWithJotai,
} from "@/utils/testing";
import {
  createRandomName,
  createRandomDate,
  createRandomInteger,
} from "@shared/utils/testing";
import useUpdateSchema from "./useUpdateSchema";
import { act } from "react";
import { schemaAtom, SchemaInference } from "@/core/StateProvider/schema";
import { activeConfigurationAtom } from "@/core/StateProvider/configuration";
import { createNewConfigurationId } from "@/core";
import { useAtomValue } from "jotai";

describe("useUpdateSchema", () => {
  describe("setSyncFailure", () => {
    it("should do nothing if no schema exists", async () => {
      const { result } = renderHookWithJotai(useTestSetup);
      await act(async () => await result.current.setSyncFailure());
      expect(result.current.schemas).toHaveLength(0);
    });

    it("should update existing schema", async () => {
      const configId = createNewConfigurationId();
      const existingSchema = createRandomSchema();
      const { result } = renderHookWithJotai(useTestSetup, snapshot => {
        snapshot.set(activeConfigurationAtom, configId);
        snapshot.set(schemaAtom, new Map([[configId, existingSchema]]));
      });
      await act(async () => await result.current.setSyncFailure());

      const schema = result.current.schemas.get(configId);
      expect(schema).toEqual({
        ...existingSchema,
        lastSyncFail: true,
      } satisfies SchemaInference);
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

    it("should set schema when none set", async () => {
      const configId = createNewConfigurationId();
      const schemaResponse = createRandomSchemaResponse();

      const { result } = renderHookWithJotai(useTestSetup, snapshot => {
        snapshot.set(activeConfigurationAtom, configId);
      });

      await act(async () => await result.current.replaceSchema(schemaResponse));

      const schema = result.current.schemas.get(configId);
      expect(schema).toStrictEqual({
        ...schemaResponse,
        lastSyncFail: false,
        lastUpdate: vi.getMockedSystemTime()!,
        triedToSync: true,
      } satisfies SchemaInference);
    });

    it("should update existing schema", async () => {
      const configId = createNewConfigurationId();
      const existingSchema = createRandomSchema();
      const schemaResponse = createRandomSchemaResponse();

      const { result } = renderHookWithJotai(useTestSetup, snapshot => {
        snapshot.set(activeConfigurationAtom, configId);
        snapshot.set(schemaAtom, new Map([[configId, existingSchema]]));
      });
      await act(async () => await result.current.replaceSchema(schemaResponse));

      expect(result.current.schemas.get(configId)).toEqual({
        ...schemaResponse,
        lastSyncFail: false,
        lastUpdate: vi.getMockedSystemTime()!,
        triedToSync: true,
      } satisfies SchemaInference);
    });
  });

  describe("updateVertexTotal", () => {
    it("should do nothing if no schema exists", async () => {
      const configId = createNewConfigurationId();
      const vertexType = createRandomName("VertexType");
      const vertexTotal = createRandomInteger();

      const { result } = renderHookWithJotai(useTestSetup, snapshot => {
        snapshot.set(activeConfigurationAtom, configId);
      });

      await act(
        async () =>
          await result.current.updateVertexTotal(vertexType, vertexTotal)
      );

      expect(result.current.schemas).toHaveLength(0);
    });

    it("should update total on given vertex type", async () => {
      const configId = createNewConfigurationId();
      const vertexType = createRandomName("VertexType");
      const vertexTotal = createRandomInteger();
      const existingSchema = createRandomSchema();
      existingSchema.vertices[0].type = vertexType;

      const { result } = renderHookWithJotai(useTestSetup, snapshot => {
        snapshot.set(activeConfigurationAtom, configId);
        snapshot.set(schemaAtom, new Map([[configId, existingSchema]]));
      });

      await act(
        async () =>
          await result.current.updateVertexTotal(vertexType, vertexTotal)
      );

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
