import { CreateRenderer, Renderer, RenderResult, RenderHookOptions } from '../types';
import { cleanup, addCleanup, removeCleanup } from './cleanup';
import { suppressErrorOutput } from './console';
declare function createRenderHook<TProps, TResult, TRendererOptions extends object, TRenderer extends Renderer<TProps>>(createRenderer: CreateRenderer<TProps, TResult, TRendererOptions, TRenderer>): (callback: (props: TProps) => TResult, options?: RenderHookOptions<TProps> & TRendererOptions) => {
    waitFor: import("../types").WaitFor;
    waitForValueToChange: import("../types").WaitForValueToChange;
    waitForNextUpdate: import("../types").WaitForNextUpdate;
    result: RenderResult<TResult>;
    rerender: (newProps?: TProps | undefined) => void;
    unmount: () => void;
} & Omit<TRenderer, "render" | "act" | "rerender" | "unmount">;
export { createRenderHook, cleanup, addCleanup, removeCleanup, suppressErrorOutput };
