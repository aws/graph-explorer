import { reduce as dragOffset } from './dragOffset';
import { reduce as dragOperation, } from './dragOperation';
import { reduce as refCount } from './refCount';
import { reduce as dirtyHandlerIds, } from './dirtyHandlerIds';
import { reduce as stateId } from './stateId';
import { get } from '../utils/js_utils';
export function reduce(state = {}, action) {
    return {
        dirtyHandlerIds: dirtyHandlerIds(state.dirtyHandlerIds, {
            type: action.type,
            payload: {
                ...action.payload,
                prevTargetIds: get(state, 'dragOperation.targetIds', []),
            },
        }),
        dragOffset: dragOffset(state.dragOffset, action),
        refCount: refCount(state.refCount, action),
        dragOperation: dragOperation(state.dragOperation, action),
        stateId: stateId(state.stateId),
    };
}
