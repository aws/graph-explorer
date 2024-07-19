export const env = {
  DEV: import.meta.env.MODE !== "production",
  PROD: import.meta.env.MODE === "production",
  MODE: import.meta.env.MODE,
};
