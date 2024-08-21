/*

# Dev Note

Serializing JSON data to a file has a couple of "gotchas". 

## Dates
In JSON, `Date` values will be converted to strings. When deserializing a JSON
date string it is nearly impossible to know if they should be deserialized as
strings or `Date` objects. 

To ensure these values are deserialized properly, we need to describe the type
during serialization with a wrapper object. During deserialization we can read
the described type and construct the proper type.

## Maps & Sets

In JSON, the `Map` & `Set` types do not serialize or deserialize on their own.
Instead, we need to convert maps & sets to arrays. In addition, we must describe
the type as `Map` or `Set` to disambiguate from proper arrays.

*/

/** Serializes JSON data to a form suitable for a file that can be more easily deserialized later. */
export function serializeData(data: any): any {
  if (data instanceof Date) {
    // Wrap dates in an object describing the type and convert to string
    return { __type: "Date", value: data.toISOString() };
  } else if (data instanceof Map) {
    // Wrap maps in an object describing the type and convert to array of array
    return {
      __type: "Map",
      value: Array.from(data.entries()).map(([key, value]) => [
        key,
        serializeData(value),
      ]),
    };
  } else if (data instanceof Set) {
    // Wrap sets in an object describing the type and convert to array of array
    return {
      __type: "Set",
      value: Array.from(data.values()).map(value => serializeData(value)),
    };
  } else if (Array.isArray(data)) {
    // Recursively serialize array items
    return data.map(serializeData);
  } else if (typeof data === "object" && data !== null) {
    // Recursively serialize object values
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, serializeData(value)])
    );
  } else {
    // Must be a literal type that serializes fine on its own
    return data;
  }
}

/** Deserializes JSON data that was serialized with `serializeData`. */
export function deserializeData(data: unknown): unknown {
  if (data && typeof data === "object" && "__type" in data && "value" in data) {
    // Deserialize custom type wrappers
    if (data.__type === "Date" && typeof data.value === "string") {
      // Deserialize inner date value to Date
      return new Date(data.value);
    } else if (data.__type === "Map" && Array.isArray(data.value)) {
      // Deserialize inner array values to Map entries
      return new Map(
        data.value.map(([key, value]: [string, any]) => [
          key,
          deserializeData(value),
        ])
      );
    } else if (data.__type === "Set" && Array.isArray(data.value)) {
      // Deserialize inner array values to Set entries
      return new Set(data.value.map(value => deserializeData(value)));
    }
  } else if (Array.isArray(data)) {
    // Recursively deserialize array
    return data.map(deserializeData);
  } else if (typeof data === "object" && data !== null) {
    // Recursively deserialize object values
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, deserializeData(value)])
    );
  } else {
    // Literal type deserializes fine on its own
    return data;
  }
}
