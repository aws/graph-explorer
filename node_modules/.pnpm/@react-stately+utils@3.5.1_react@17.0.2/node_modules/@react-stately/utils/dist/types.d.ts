export function useControlledState<T>(value: T, defaultValue: T, onChange: (value: T, ...args: any[]) => void): [T, (value: T, ...args: any[]) => void];
/**
 * Takes a value and forces it to the closest min/max if it's outside. Also forces it to the closest valid step.
 */
export function clamp(value: number, min?: number, max?: number): number;
export function snapValueToStep(value: number, min: number, max: number, step: number): number;
export function toFixedNumber(value: number, digits: number, base?: number): number;

//# sourceMappingURL=types.d.ts.map
