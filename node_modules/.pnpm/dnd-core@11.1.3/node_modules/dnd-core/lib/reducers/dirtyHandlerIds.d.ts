import { Action } from '../interfaces';
export declare type State = string[];
export interface DirtyHandlerIdPayload {
    targetIds: string[];
    prevTargetIds: string[];
}
export declare function reduce(_state: State | undefined, action: Action<DirtyHandlerIdPayload>): State;
