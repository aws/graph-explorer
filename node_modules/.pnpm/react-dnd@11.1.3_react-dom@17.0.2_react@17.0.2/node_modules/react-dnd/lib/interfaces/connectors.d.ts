/// <reference types="react" />
import { DragSourceOptions, DragPreviewOptions } from '../interfaces';
export declare type ConnectableElement = React.RefObject<any> | React.ReactElement | Element | null;
export declare type DragElementWrapper<Options> = (elementOrNode: ConnectableElement, options?: Options) => React.ReactElement | null;
export declare type ConnectDragSource = DragElementWrapper<DragSourceOptions>;
export declare type ConnectDragPreview = DragElementWrapper<DragPreviewOptions>;
export declare type ConnectDropTarget = DragElementWrapper<any>;
