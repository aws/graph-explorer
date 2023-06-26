import { OverlayTriggerProps } from "@react-types/overlays";
export interface OverlayTriggerState {
    /** Whether the overlay is currently open. */
    readonly isOpen: boolean;
    /** Sets whether the overlay is open. */
    setOpen(isOpen: boolean): void;
    /** Opens the overlay. */
    open(): void;
    /** Closes the overlay. */
    close(): void;
    /** Toggles the overlay's visibility. */
    toggle(): void;
}
/**
 * Manages state for an overlay trigger. Tracks whether the overlay is open, and provides
 * methods to toggle this state.
 */
export function useOverlayTriggerState(props: OverlayTriggerProps): OverlayTriggerState;
export type { OverlayTriggerProps } from '@react-types/overlays';

//# sourceMappingURL=types.d.ts.map
