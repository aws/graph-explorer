import { FocusStrategy } from "@react-types/shared";
import { MenuTriggerProps } from "@react-types/menu";
import { OverlayTriggerState } from "@react-stately/overlays";
export interface MenuTriggerState extends OverlayTriggerState {
    /** Controls which item will be auto focused when the menu opens. */
    readonly focusStrategy: FocusStrategy;
    /** Opens the menu. */
    open(focusStrategy?: FocusStrategy | null): void;
    /** Toggles the menu. */
    toggle(focusStrategy?: FocusStrategy | null): void;
}
/**
 * Manages state for a menu trigger. Tracks whether the menu is currently open,
 * and controls which item will receive focus when it opens.
 */
export function useMenuTriggerState(props: MenuTriggerProps): MenuTriggerState;
export type { MenuTriggerProps } from '@react-types/menu';

//# sourceMappingURL=types.d.ts.map
