import {
  createRandomSchema,
  createRandomSchemaResponse,
  renderHookWithRecoilRoot,
} from "@/utils/testing";
import {
  createRandomName,
  createRandomDate,
  createRandomInteger,
} from "@shared/utils/testing";
import useUpdateSchema from "./useUpdateSchema";
import { act } from "@testing-library/react";
import { useRecoilValue } from "recoil";
import { schemaAtom, SchemaInference } from "@/core/StateProvider/schema";
import { activeConfigurationAtom } from "@/core/StateProvider/configuration";

describe("useUpdateSchema", () => {
  describe("setSyncFailure", () => {
    it("should do nothing if no schema exists", () => {
      const { result } = renderHookWithRecoilRoot(render);
      act(() => result.current.setSyncFailure());

      expect(result.current.schemas).toHaveLength(0);
    });

    it("should update existing schema", () => {
      const configId = createRandomName("ConfigId");
      const existingSchema = createRandomSchema();
      const { result } = renderHookWithRecoilRoot(render, snapshot => {
        snapshot.set(activeConfigurationAtom, configId);
        snapshot.set(schemaAtom, new Map([[configId, existingSchema]]));
      });
      act(() => result.current.setSyncFailure());

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

    it("should set schema when none set", () => {
      const configId = createRandomName("ConfigId");
      const schemaResponse = createRandomSchemaResponse();

      const { result } = renderHookWithRecoilRoot(render, snapshot => {
        snapshot.set(activeConfigurationAtom, configId);
      });

      act(() => result.current.replaceSchema(schemaResponse));

      const schema = result.current.schemas.get(configId);
      expect(schema).toStrictEqual({
        ...schemaResponse,
        lastSyncFail: false,
        lastUpdate: vi.getMockedSystemTime()!,
        triedToSync: true,
      } satisfies SchemaInference);
    });

    it("should update existing schema", () => {
      const configId = createRandomName("ConfigId");
      const existingSchema = createRandomSchema();
      const schemaResponse = createRandomSchemaResponse();

      const { result } = renderHookWithRecoilRoot(render, snapshot => {
        snapshot.set(activeConfigurationAtom, configId);
        snapshot.set(schemaAtom, new Map([[configId, existingSchema]]));
      });
      act(() => result.current.replaceSchema(schemaResponse));

      expect(result.current.schemas.get(configId)).toEqual({
        ...schemaResponse,
        lastSyncFail: false,
        lastUpdate: vi.getMockedSystemTime()!,
        triedToSync: true,
      } satisfies SchemaInference);
    });
  });

  describe("updateVertexTotal", () => {
    it("should do nothing if no schema exists", () => {
      const configId = createRandomName("ConfigId");
      const vertexType = createRandomName("VertexType");
      const vertexTotal = createRandomInteger();

      const { result } = renderHookWithRecoilRoot(render, snapshot => {
        snapshot.set(activeConfigurationAtom, configId);
      });

      act(() => result.current.updateVertexTotal(vertexType, vertexTotal));

      expect(result.current.schemas).toHaveLength(0);
    });

    it("should update total on given vertex type", () => {
      const configId = createRandomName("ConfigId");
      const vertexType = createRandomName("VertexType");
      const vertexTotal = createRandomInteger();
      const existingSchema = createRandomSchema();
      existingSchema.vertices[0].type = vertexType;

      const { result } = renderHookWithRecoilRoot(render, snapshot => {
        snapshot.set(activeConfigurationAtom, configId);
        snapshot.set(schemaAtom, new Map([[configId, existingSchema]]));
      });

      act(() => result.current.updateVertexTotal(vertexType, vertexTotal));

      const schema = result.current.schemas.get(configId)!;
      const vtConfig = schema.vertices.find(v => v.type === vertexType);
      expect(vtConfig?.total).toEqual(vertexTotal);
    });
  });
});

function render() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const actions = useUpdateSchema();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const schemas = useRecoilValue(schemaAtom);
  return { schemas, ...actions };
}
