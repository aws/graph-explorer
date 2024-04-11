import { RawConfiguration, Schema } from "../../core";
import { useSetRecoilState } from "recoil";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "../../core/StateProvider/configuration";
import { useEffect, useMemo } from "react";

/**
 * Initializes a configuration in Recoil state that can be used for testing.
 * @param schema The schema to use in the config
 */
export function useTestSchema(schema: Schema) {
  const setConfigMap = useSetRecoilState(configurationAtom);
  const setActiveConfigId = useSetRecoilState(activeConfigurationAtom);

  const config: RawConfiguration = useMemo(
    () => ({
      id: "test-config-id",
      schema,
      connection: { url: "https://www.example.com" },
    }),
    [schema]
  );

  useEffect(() => {
    // Add the config to the config map
    setConfigMap(prev => {
      const updatedConfig = new Map(prev);
      updatedConfig.set(config.id, config);
      return updatedConfig;
    });

    // Set the config as active
    setActiveConfigId(config.id);
  }, [config, setConfigMap, setActiveConfigId]);
}
