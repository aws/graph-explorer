export const layoutNames = [
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
] as const;

export type LayoutName = (typeof layoutNames)[number];

export const DEFAULT_GRAPH_LAYOUT: LayoutName = "F_COSE";

const layoutNameSet = new Set<string>(layoutNames);

export function isLayoutName(value: unknown): value is LayoutName {
  return typeof value === "string" && layoutNameSet.has(value);
}
