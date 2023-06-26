import { PUBLISH_DRAG_SOURCE } from './types';
export function createPublishDragSource(manager) {
    return function publishDragSource() {
        const monitor = manager.getMonitor();
        if (monitor.isDragging()) {
            return { type: PUBLISH_DRAG_SOURCE };
        }
    };
}
