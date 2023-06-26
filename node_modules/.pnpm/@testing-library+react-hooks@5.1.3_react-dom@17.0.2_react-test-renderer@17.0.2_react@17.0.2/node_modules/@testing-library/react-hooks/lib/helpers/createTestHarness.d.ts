/// <reference types="react" />
import { RendererProps, WrapperComponent } from '../types/react';
declare function createTestHarness<TProps, TResult>({ callback, setValue, setError }: RendererProps<TProps, TResult>, Wrapper?: WrapperComponent<TProps>, suspense?: boolean): (props?: TProps | undefined) => JSX.Element;
export { createTestHarness };
