const getNestedObjectValue = (
  nestedObj: Record<string, unknown>,
  path: string[]
): string | number => {
  return (path.reduce((obj, key) => {
    return (obj?.[key] !== undefined ? obj[key] : undefined) as Record<
      string,
      unknown
    >;
  }, nestedObj) as unknown) as string | number;
};

export default getNestedObjectValue;
