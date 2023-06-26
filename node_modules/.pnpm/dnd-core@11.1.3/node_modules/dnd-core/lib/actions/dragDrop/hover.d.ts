import { Action, DragDropManager, HoverPayload, HoverOptions } from '../../interfaces';
export declare function createHover(manager: DragDropManager): (targetIdsArg: string[], { clientOffset }?: HoverOptions) => Action<HoverPayload>;
