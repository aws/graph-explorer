import { SearchFieldProps } from "@react-types/searchfield";
export interface SearchFieldState {
    /** The current value of the search field. */
    readonly value: string;
    /** Sets the value of the search field. */
    setValue(value: string): void;
}
/**
 * Provides state management for a search field.
 */
export function useSearchFieldState(props: SearchFieldProps): SearchFieldState;
export type { SearchFieldProps } from '@react-types/searchfield';

//# sourceMappingURL=types.d.ts.map
