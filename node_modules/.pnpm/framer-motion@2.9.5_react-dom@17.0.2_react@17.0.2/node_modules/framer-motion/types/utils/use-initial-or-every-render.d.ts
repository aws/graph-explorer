declare type Callback = () => void;
/**
 * Use callback either only on the initial render or on all renders. In concurrent mode
 * the "initial" render might run multiple times
 *
 * @param callback - Callback to run
 * @param isInitialOnly - Set to `true` to only run on initial render, or `false` for all renders. Defaults to `false`.
 *
 * @public
 */
export declare function useInitialOrEveryRender(callback: Callback, isInitialOnly?: boolean): void;
export {};
