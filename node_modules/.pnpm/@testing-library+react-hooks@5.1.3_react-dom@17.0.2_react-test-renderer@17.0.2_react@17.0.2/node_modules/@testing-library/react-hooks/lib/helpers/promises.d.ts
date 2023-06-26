declare function resolveAfter(ms: number): Promise<void>;
declare function callAfter(callback: () => void, ms: number): Promise<void>;
export { resolveAfter, callAfter };
