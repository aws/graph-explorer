function validateJson(value) {
  if (typeof value === "string" && value.trim().length === 0) {
    return true;
  }
  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    return false;
  }
}

export { validateJson };
//# sourceMappingURL=validate-json.js.map
