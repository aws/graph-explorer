import { useRecoilValue } from "recoil";
import renderHookWithRecoilRoot from "../../utils/testing/renderHookWithRecoilRoot";
import {
  activeConfigurationAtom,
  activeConnectionSelector,
  configurationAtom,
  prefixesSelector,
} from "./configuration";
import {
  createRandomName,
  createRandomRawConfiguration,
  pickRandomElement,
} from "../../utils/testing/randomData";
import { ConnectionConfig } from "../ConfigurationProvider";
import { schemaAtom } from "./schema";

describe("configuration atoms", () => {
  describe("activeConnectionSelector", () => {
    it("should be undefined when no config", async () => {
      const { result } = renderHookWithRecoilRoot(() =>
        useRecoilValue(activeConnectionSelector)
      );

      expect(result.current).toBeUndefined();
    });

    it("should be undefined when active config does not exist", async () => {
      const { result } = renderHookWithRecoilRoot(
        () => useRecoilValue(activeConnectionSelector),
        snapshot => {
          snapshot.set(
            configurationAtom,
            new Map([
              [
                createRandomName("other-config-id"),
                createRandomRawConfiguration(),
              ],
            ])
          );
          snapshot.set(activeConfigurationAtom, createRandomName("config-id"));
        }
      );

      expect(result.current).toBeUndefined();
    });

    it("should be correct connection", async () => {
      const config = createRandomRawConfiguration();
      const { result } = renderHookWithRecoilRoot(
        () => useRecoilValue(activeConnectionSelector),
        snapshot => {
          snapshot.set(configurationAtom, new Map([[config.id, config]]));
          snapshot.set(activeConfigurationAtom, config.id);
        }
      );

      expect(result.current).toEqual(config.connection);
    });

    it("should be correct config", async () => {
      const config = createRandomRawConfiguration();
      const { result } = renderHookWithRecoilRoot(
        () => useRecoilValue(activeConnectionSelector),
        snapshot => {
          snapshot.set(configurationAtom, new Map([[config.id, config]]));
          snapshot.set(activeConfigurationAtom, config.id);
        }
      );

      expect(result.current).toEqual(config.connection);
    });

    it("should create empty connection when undefined on config", async () => {
      const config = createRandomRawConfiguration();
      config.connection = undefined;
      const { result } = renderHookWithRecoilRoot(
        () => useRecoilValue(activeConnectionSelector),
        snapshot => {
          snapshot.set(configurationAtom, new Map([[config.id, config]]));
          snapshot.set(activeConfigurationAtom, config.id);
        }
      );

      const expected: ConnectionConfig = {
        queryEngine: "gremlin",
        url: "",
        graphDbUrl: "",
      };
      expect(result.current).toEqual(expected);
    });

    it("should remove trailing slashes in URLs", async () => {
      const config = createRandomRawConfiguration();
      config.connection!.url = "http://www.example.com/";
      config.connection!.graphDbUrl = "http://www.example.com/";
      const { result } = renderHookWithRecoilRoot(
        () => useRecoilValue(activeConnectionSelector),
        snapshot => {
          const configId = config.id;
          snapshot.set(configurationAtom, new Map([[configId, config]]));
          snapshot.set(activeConfigurationAtom, configId);
        }
      );

      const expected: ConnectionConfig = {
        ...config.connection!,
        url: "http://www.example.com",
        graphDbUrl: "http://www.example.com",
      };
      expect(result.current).toEqual(expected);
    });

    it("should default to gremlin query engine", async () => {
      const config = createRandomRawConfiguration();
      config.connection!.queryEngine = undefined;
      const { result } = renderHookWithRecoilRoot(
        () => useRecoilValue(activeConnectionSelector),
        snapshot => {
          const configId = config.id;
          snapshot.set(configurationAtom, new Map([[configId, config]]));
          snapshot.set(activeConfigurationAtom, configId);
        }
      );

      const expected: ConnectionConfig = {
        ...config.connection!,
        queryEngine: "gremlin",
      };
      expect(result.current).toEqual(expected);
    });
  });

  describe("prefixesSelector", () => {
    it("should be undefined when no config", async () => {
      const { result } = renderHookWithRecoilRoot(() =>
        useRecoilValue(prefixesSelector)
      );

      expect(result.current).toBeUndefined();
    });

    it("should be undefined when active config does not exist", async () => {
      const { result } = renderHookWithRecoilRoot(
        () => useRecoilValue(prefixesSelector),
        snapshot => {
          snapshot.set(
            configurationAtom,
            new Map([
              [
                createRandomName("other-config-id"),
                createRandomRawConfiguration(),
              ],
            ])
          );
          snapshot.set(activeConfigurationAtom, createRandomName("config-id"));
        }
      );

      expect(result.current).toBeUndefined();
    });

    it("should be undefined when not sparql", async () => {
      const config = createRandomRawConfiguration();
      config.connection!.queryEngine = pickRandomElement([
        "gremlin",
        "openCypher",
      ]);
      const { result } = renderHookWithRecoilRoot(
        () => useRecoilValue(prefixesSelector),
        snapshot => {
          const configId = config.id;
          snapshot.set(configurationAtom, new Map([[configId, config]]));
          snapshot.set(activeConfigurationAtom, configId);
          snapshot.set(schemaAtom, new Map([[configId, config.schema!]]));
        }
      );

      expect(config.schema?.prefixes).toBeTruthy();
      expect(result.current).toBeUndefined();
    });

    it("should be correct prefixes", async () => {
      const config = createRandomRawConfiguration();
      config.connection!.queryEngine = "sparql";
      const { result } = renderHookWithRecoilRoot(
        () => useRecoilValue(prefixesSelector),
        snapshot => {
          const configId = config.id;
          snapshot.set(configurationAtom, new Map([[configId, config]]));
          snapshot.set(activeConfigurationAtom, configId);
          snapshot.set(schemaAtom, new Map([[configId, config.schema!]]));
        }
      );

      expect(config.schema?.prefixes).toBeTruthy();
      expect(result.current).toEqual(config.schema?.prefixes);
    });

    it("should be empty array when undefined on schema", async () => {
      const config = createRandomRawConfiguration();
      config.connection!.queryEngine = "sparql";
      config.schema!.prefixes = undefined;
      const { result } = renderHookWithRecoilRoot(
        () => useRecoilValue(prefixesSelector),
        snapshot => {
          const configId = config.id;
          snapshot.set(configurationAtom, new Map([[configId, config]]));
          snapshot.set(activeConfigurationAtom, configId);
          snapshot.set(schemaAtom, new Map([[configId, config.schema!]]));
        }
      );

      expect(result.current).toEqual([]);
    });
  });
});
