declare const renderHook: <TProps, TResult>(callback: (props: TProps) => TResult, options?: import("./types/react").RenderHookOptions<TProps> | undefined) => import("./types").RenderHookResult<TProps, TResult, import("./types").Renderer<TProps>>, act: import("./types").Act, cleanup: () => void, addCleanup: (callback: import("./types").CleanupCallback) => () => void, removeCleanup: (callback: import("./types").CleanupCallback) => void, suppressErrorOutput: () => () => void;
export { renderHook, act, cleanup, addCleanup, removeCleanup, suppressErrorOutput };
export * from './types/react';
