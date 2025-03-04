import { activeConfigurationAtom, configurationAtom, schemaAtom } from "@/core";
import {
  createRandomRawConfiguration,
  createRandomSchema,
  renderHookWithRecoilRoot,
} from "@/utils/testing";
import { waitFor } from "@testing-library/react";
import { act } from "react";
import { useRecoilValue } from "recoil";
import { useDeleteActiveConfiguration } from "./useDeleteConfig";

test("should delete the active configuration", async () => {
  const config1 = createRandomRawConfiguration();

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useDeleteActiveConfiguration();
      const allConfigs = useRecoilValue(configurationAtom);
      const activeConfig = useRecoilValue(activeConfigurationAtom);

      return { callback, allConfigs, activeConfig };
    },
    snapshot => {
      snapshot.set(activeConfigurationAtom, config1.id);
      snapshot.set(configurationAtom, new Map([[config1.id, config1]]));
    }
  );

  act(() => {
    result.current.callback();
  });

  await waitFor(() => {
    expect(result.current.activeConfig).toBeNull();
    expect(result.current.allConfigs.size).toBe(0);
  });
});

test("should delete the active schema", async () => {
  const config1 = createRandomRawConfiguration();
  const schema1 = createRandomSchema();

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useDeleteActiveConfiguration();
      const allSchemas = useRecoilValue(schemaAtom);

      return { callback, allSchemas };
    },
    snapshot => {
      snapshot.set(activeConfigurationAtom, config1.id);
      snapshot.set(configurationAtom, new Map([[config1.id, config1]]));
      snapshot.set(schemaAtom, new Map([[config1.id, schema1]]));
    }
  );

  act(() => {
    result.current.callback();
  });

  await waitFor(() => {
    expect(result.current.allSchemas.size).toBe(0);
  });
});
