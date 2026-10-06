import { z } from "zod";

import { logger } from "@/utils";

/** Identifiers for the graph layout algorithms a user can choose. */
export const layoutNameSchema = z.enum([
  "CONCENTRIC",
  "DAGRE_TB",
  "DAGRE_BT",
  "DAGRE_LR",
  "DAGRE_RL",
  "F_COSE",
  "D3",
  "KLAY_LR",
  "KLAY_TB",
  "SUBWAY_TB",
  "SUBWAY_BT",
  "SUBWAY_LR",
  "SUBWAY_RL",
]);

export type LayoutName = z.infer<typeof layoutNameSchema>;

/** The layout names as a readonly tuple, e.g. for random test selection. */
export const layoutNames = layoutNameSchema.options;

/** The layout used until the user chooses another. */
export const DEFAULT_LAYOUT_NAME: LayoutName = "F_COSE";

/**
 * A persisted layout name. A missing value predates the choice being stored, so
 * it quietly takes the default; an unknown one (e.g. a removed layout) also
 * takes the default, with a warning, so the surrounding layout survives.
 */
export const storedLayoutNameSchema = layoutNameSchema
  .default(DEFAULT_LAYOUT_NAME)
  .catch(({ input }) => {
    logger.warn(
      `[graph-layout] Unrecognized layout name; using "${DEFAULT_LAYOUT_NAME}"`,
      input,
    );
    return DEFAULT_LAYOUT_NAME;
  });
