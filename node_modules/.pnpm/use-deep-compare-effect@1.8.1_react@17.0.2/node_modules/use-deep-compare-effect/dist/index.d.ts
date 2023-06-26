import * as React from 'react';
declare type UseEffectParams = Parameters<typeof React.useEffect>;
declare type EffectCallback = UseEffectParams[0];
declare type DependencyList = UseEffectParams[1];
declare type UseEffectReturn = ReturnType<typeof React.useEffect>;
/**
 * @param value the value to be memoized (usually a dependency list)
 * @returns a momoized version of the value as long as it remains deeply equal
 */
export declare function useDeepCompareMemoize<T>(value: T): T;
declare function useDeepCompareEffect(callback: EffectCallback, dependencies: DependencyList): UseEffectReturn;
export declare function useDeepCompareEffectNoCheck(callback: EffectCallback, dependencies: DependencyList): UseEffectReturn;
export default useDeepCompareEffect;
