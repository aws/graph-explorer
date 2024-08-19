export const env = {
  DEV: import.meta.env.MODE !== "production",
  PROD: import.meta.env.MODE === "production",
  MODE: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,
  GRAPH_EXP_FEEDBACK_URL: import.meta.env.GRAPH_EXP_FEEDBACK_URL,
};
