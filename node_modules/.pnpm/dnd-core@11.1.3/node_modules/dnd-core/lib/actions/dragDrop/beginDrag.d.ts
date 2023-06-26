import { Action, DragDropManager, BeginDragPayload, BeginDragOptions, Identifier } from '../../interfaces';
export declare function createBeginDrag(manager: DragDropManager): (sourceIds?: Identifier[], options?: BeginDragOptions) => Action<BeginDragPayload> | undefined;
