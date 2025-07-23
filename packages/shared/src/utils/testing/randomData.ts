import { v4 } from "uuid";

/*

# Developer Note

These helper functions are provided to allow for easier test data creation.

When creating test data you should start with a random object, then set the values
that directly apply to the logic you are testing.

The randomness of all the other values ensures that the logic under test is not 
affected by those values, regardless of what they are.

*/

/**
 * Creates a random string with a prefix, if provided.
 * @param prefix The prefix to prepend to the string.
 * @returns A random string that will resemble "prefix-8d49f0".
 */
export function createRandomName(prefix: string = ""): string {
  return `${prefix}${prefix.length > 0 ? "-" : ""}${v4().substring(0, 6)}`;
}

/**
 * Creates a random boolean.
 * @returns A random boolean value.
 */
export function createRandomBoolean(): boolean {
  return Math.random() < 0.5;
}

/**
 * Creates a random integer.
 * @param options The options for the random integer.
 * @param options.min The minimum value the random integer can have (inclusive). Defaults to 0.
 * @param options.max The maximum value the random integer can have (inclusive). Defaults to 100000.
 * @returns A random integer value from 0 to the max.
 */
export function createRandomInteger(options?: {
  min?: number;
  max?: number;
}): number {
  const min = options?.min ?? 0;
  const max = options?.max ?? 100000;

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Creates a random double.
 * @param min The minimum value the random double can have. Defaults to 0.
 * @param max The maximum value the random double can have. Defaults to 1000.
 * @returns A random double value from the min to the max.
 */
export function createRandomDouble(min?: number, max?: number) {
  if (min !== undefined && max !== undefined) {
    return Math.random() * (max - min) + min;
  } else {
    return Math.random() * createRandomInteger();
  }
}

/**
 * Randomly creates a hex value for an RGB color.
 * @returns The hex string of the random color.
 */
export function createRandomColor(): string {
  const letters = "0123456789ABCDEF".split("");
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.round(Math.random() * 15)];
  }
  return color;
}

/**
 * Randomly creates a URL string.
 * @returns The URL string.
 */
export function createRandomUrlString(): string {
  const scheme = pickRandomElement(["http", "https"]);
  const host = createRandomName("host");
  const port = pickRandomElement([
    "",
    `:${createRandomInteger({ max: 30000 })}`,
  ]);
  const path = pickRandomElement(["", `/${createRandomName("path")}`]);
  return `${scheme}://${host}${port}${path}`;
}

/**
 * Creates a random date.
 * @param start The lower bound of the random date.
 * @param end The upper bound of the random date.
 * @returns A random `Date` value bound by the given `start` and `end` values.
 */
export function createRandomDate(start?: Date, end?: Date): Date {
  const startTime = start ? start.getTime() : new Date(1970, 0, 1).getTime();
  const endTime = end ? end.getTime() : new Date().getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

/**
 * Randomly returns the provided value or undefined.
 * @returns Either the value or undefined.
 */
export function randomlyUndefined<T>(value: T): T | undefined {
  return createRandomBoolean() ? value : undefined;
}

/**
 * Creates an array containing values generated from the factory function with the given length.
 * @param length The number of items to generate.
 * @param factory A function to generate the desired value.
 * @returns An array with items generated using the factory function.
 */
export function createArray<T>(length: number, factory: () => T): T[] {
  return Array.from({ length }, factory);
}

export function createRecord<TValue>(
  length: number,
  factory: () => { key: string; value: TValue }
): Record<string, TValue> {
  const result: Record<string, TValue> = {};

  for (let i = 0; i < length; i++) {
    const newEntry = factory();
    result[newEntry.key] = newEntry.value;
  }

  return result;
}

function pickRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
