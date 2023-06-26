import { DndOptions } from '../interfaces';
import { DragLayerCollector, DndComponentEnhancer } from './interfaces';
export declare function DragLayer<RequiredProps, CollectedProps = any>(collect: DragLayerCollector<RequiredProps, CollectedProps>, options?: DndOptions<RequiredProps>): DndComponentEnhancer<CollectedProps>;
