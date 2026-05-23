// @vitest-environment happy-dom
import { renderHookWithState } from "@/utils/testing";

import { useFeatureFlags } from "./featureFlags";

describe("useFeatureFlags", () => {
  test("should return default feature flags", () => {
    const { result } = renderHookWithState(() => useFeatureFlags());
    expect(result.current).toStrictEqual({
      showDebugActions: false,
      allowLoggingDbQuery: false,
    });
  });
});
