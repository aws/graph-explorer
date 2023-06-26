import { ValueType } from "style-value-types";
/**
 * ValueType for "auto"
 */
export declare const auto: ValueType;
/**
 * Tests a dimensional value against the list of dimension ValueTypes
 */
export declare const findDimensionValueType: (v: any) => ValueType | undefined;
/**
 * Tests a value against the list of ValueTypes
 */
export declare const findValueType: (v: any) => ValueType | {
    test: (v: any) => boolean;
    parse: (v: any) => (number | import("style-value-types").RGBA | import("style-value-types").HSLA)[];
    createTransformer: (prop: string) => (v: (number | import("style-value-types").RGBA | import("style-value-types").HSLA)[]) => string;
    getAnimatableNone: (target: string) => string;
} | undefined;
/**
 * Gets the default ValueType for the provided value key
 */
export declare const getDefaultValueType: (key: string) => ValueType;
/**
 * Provided a value and a ValueType, returns the value as that value type.
 */
export declare const getValueAsType: (value: any, type?: ValueType | undefined) => any;
