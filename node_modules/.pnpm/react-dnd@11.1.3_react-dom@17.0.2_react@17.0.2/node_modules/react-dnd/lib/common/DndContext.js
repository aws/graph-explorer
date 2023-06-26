import * as React from 'react';
import { createDragDropManager, } from 'dnd-core';
/**
 * Create the React Context
 */
export const DndContext = React.createContext({
    dragDropManager: undefined,
});
/**
 * Creates the context object we're providing
 * @param backend
 * @param context
 */
export function createDndContext(backend, context, options, debugMode) {
    return {
        dragDropManager: createDragDropManager(backend, context, options, debugMode),
    };
}
