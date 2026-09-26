import type {
  ConfigurationId,
  RawConfiguration,
} from "../ConfigurationProvider";

import { transformLegacyConnection } from "./configuration";

/**
 * ReadTransform for the configuration map: transforms each entry's connection
 * from the legacy `url`/`proxyConnection` shape to the canonical `graphDbUrl`
 * field, so every consumer of `configurationAtom` — not just the active
 * connection — sees an already-migrated connection. An entry without a
 * connection passes through untouched.
 */
export function transformConfiguration(
  configs: Map<ConfigurationId, RawConfiguration>,
): Map<ConfigurationId, RawConfiguration> {
  return new Map(
    [...configs].map(([id, config]) => [
      id,
      config.connection
        ? {
            ...config,
            connection: transformLegacyConnection(config.connection),
          }
        : config,
    ]),
  );
}
