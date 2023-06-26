import { act } from 'react-dom/test-utils';
import { RendererOptions } from '../types/react';
declare const renderHook: <TProps, TResult>(callback: (props: TProps) => TResult, options?: import("../types").RenderHookOptions<TProps> & RendererOptions<TProps>) => {
    waitFor: import("../types").WaitFor;
    waitForValueToChange: import("../types").WaitForValueToChange;
    waitForNextUpdate: import("../types").WaitForNextUpdate;
    result: import("../types").RenderResult<TResult>;
    rerender: (newProps?: TProps | undefined) => void;
    unmount: () => void;
} & Omit<{
    render(props?: TProps | undefined): void;
    hydrate(): void;
    rerender(props?: TProps | undefined): void;
    unmount(): void;
    act: typeof act;
}, "render" | "act" | "rerender" | "unmount">;
export { renderHook, act };
export { cleanup, addCleanup, removeCleanup, suppressErrorOutput } from '../core';
export * from '../types/react';
