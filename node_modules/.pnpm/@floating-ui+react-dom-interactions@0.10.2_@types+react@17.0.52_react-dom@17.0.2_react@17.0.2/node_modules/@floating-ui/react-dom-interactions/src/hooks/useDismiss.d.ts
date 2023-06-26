import type { ElementProps, FloatingContext } from '../types';
export interface Props {
    enabled?: boolean;
    escapeKey?: boolean;
    referencePress?: boolean;
    referencePressEvent?: 'pointerdown' | 'mousedown' | 'click';
    outsidePress?: boolean;
    outsidePressEvent?: 'pointerdown' | 'mousedown' | 'click';
    ancestorScroll?: boolean;
    bubbles?: boolean;
}
/**
 * Adds listeners that dismiss (close) the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
export declare const useDismiss: <RT extends import("@floating-ui/react-dom").ReferenceElement = import("@floating-ui/react-dom").ReferenceElement>({ open, onOpenChange, refs, events, nodeId }: FloatingContext<RT>, { enabled, escapeKey, outsidePress, outsidePressEvent, referencePress, referencePressEvent, ancestorScroll, bubbles, }?: Props) => ElementProps;
