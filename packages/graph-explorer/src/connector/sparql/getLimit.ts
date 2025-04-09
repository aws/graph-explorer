export function getLimit(limit?: number, offset?: number) {
  const limitTemplate = limit ? `LIMIT ${limit}` : null;
  const offsetTemplate = offset ? `OFFSET ${offset}` : null;

  // Combine the parts that exist with a space
  return [limitTemplate, offsetTemplate].filter(Boolean).join(" ");
}
