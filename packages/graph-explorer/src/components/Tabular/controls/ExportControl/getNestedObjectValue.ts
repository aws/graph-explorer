function getNestedObjectValue<T extends object>(
  nestedObj: T,
  path: string[]
): string | number {
  return path.reduce((obj, key) => {
    return obj && key in obj ? obj[key] : undefined;
  }, nestedObj as any) as string | number;
}

export default getNestedObjectValue;
