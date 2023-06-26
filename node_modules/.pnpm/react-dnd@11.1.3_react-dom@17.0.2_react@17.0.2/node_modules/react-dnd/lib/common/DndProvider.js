import * as React from 'react';
import { memo } from 'react';
import { DndContext, createDndContext } from './DndContext';
let refCount = 0;
/**
 * A React component that provides the React-DnD context
 */
export const DndProvider = memo(({ children, ...props }) => {
    const [manager, isGlobalInstance] = getDndContextValue(props); // memoized from props
    /**
     * If the global context was used to store the DND context
     * then where theres no more references to it we should
     * clean it up to avoid memory leaks
     */
    React.useEffect(() => {
        if (isGlobalInstance) {
            refCount++;
        }
        return () => {
            if (isGlobalInstance) {
                refCount--;
                if (refCount === 0) {
                    const context = getGlobalContext();
                    context[instanceSymbol] = null;
                }
            }
        };
    }, []);
    return React.createElement(DndContext.Provider, { value: manager }, children);
});
DndProvider.displayName = 'DndProvider';
function getDndContextValue(props) {
    if ('manager' in props) {
        const manager = { dragDropManager: props.manager };
        return [manager, false];
    }
    const manager = createSingletonDndContext(props.backend, props.context, props.options, props.debugMode);
    const isGlobalInstance = !props.context;
    return [manager, isGlobalInstance];
}
const instanceSymbol = Symbol.for('__REACT_DND_CONTEXT_INSTANCE__');
function createSingletonDndContext(backend, context = getGlobalContext(), options, debugMode) {
    const ctx = context;
    if (!ctx[instanceSymbol]) {
        ctx[instanceSymbol] = createDndContext(backend, context, options, debugMode);
    }
    return ctx[instanceSymbol];
}
function getGlobalContext() {
    return typeof global !== 'undefined' ? global : window;
}
