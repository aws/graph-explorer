import { Ref, RefObject } from "react";
/**
 * Uses the ref that is passed in, or creates a new one
 * @param external - External ref
 * @internal
 */
export declare function useExternalRef<E = Element>(externalRef?: Ref<E>): RefObject<E>;
