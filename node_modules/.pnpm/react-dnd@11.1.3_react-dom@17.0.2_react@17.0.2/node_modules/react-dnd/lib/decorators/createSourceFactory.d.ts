import * as React from 'react';
import { DragSource } from 'dnd-core';
import { DragSourceMonitor } from '../interfaces';
import { DragSourceSpec } from './interfaces';
export interface Source extends DragSource {
    receiveProps(props: any): void;
}
export declare function createSourceFactory<Props, DragObject = any>(spec: DragSourceSpec<Props, DragObject>): (monitor: DragSourceMonitor, ref: React.RefObject<any>) => Source;
