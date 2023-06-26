import { XYCoord, Action } from '../interfaces';
export interface State {
    initialSourceClientOffset: XYCoord | null;
    initialClientOffset: XYCoord | null;
    clientOffset: XYCoord | null;
}
export declare function reduce(state: State | undefined, action: Action<{
    sourceClientOffset: XYCoord;
    clientOffset: XYCoord;
}>): State;
