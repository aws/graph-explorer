import { invariant } from '@react-dnd/invariant';
import { DROP } from './types';
import { isObject } from '../../utils/js_utils';
export function createDrop(manager) {
    return function drop(options = {}) {
        const monitor = manager.getMonitor();
        const registry = manager.getRegistry();
        verifyInvariants(monitor);
        const targetIds = getDroppableTargets(monitor);
        // Multiple actions are dispatched here, which is why this doesn't return an action
        targetIds.forEach((targetId, index) => {
            const dropResult = determineDropResult(targetId, index, registry, monitor);
            const action = {
                type: DROP,
                payload: {
                    dropResult: {
                        ...options,
                        ...dropResult,
                    },
                },
            };
            manager.dispatch(action);
        });
    };
}
function verifyInvariants(monitor) {
    invariant(monitor.isDragging(), 'Cannot call drop while not dragging.');
    invariant(!monitor.didDrop(), 'Cannot call drop twice during one drag operation.');
}
function determineDropResult(targetId, index, registry, monitor) {
    const target = registry.getTarget(targetId);
    let dropResult = target ? target.drop(monitor, targetId) : undefined;
    verifyDropResultType(dropResult);
    if (typeof dropResult === 'undefined') {
        dropResult = index === 0 ? {} : monitor.getDropResult();
    }
    return dropResult;
}
function verifyDropResultType(dropResult) {
    invariant(typeof dropResult === 'undefined' || isObject(dropResult), 'Drop result must either be an object or undefined.');
}
function getDroppableTargets(monitor) {
    const targetIds = monitor
        .getTargetIds()
        .filter(monitor.canDropOnTarget, monitor);
    targetIds.reverse();
    return targetIds;
}
