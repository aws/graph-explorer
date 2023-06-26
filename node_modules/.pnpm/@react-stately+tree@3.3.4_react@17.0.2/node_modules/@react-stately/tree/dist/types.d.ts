import { Collection, CollectionBase, Expandable, MultipleSelection, Node } from "@react-types/shared";
import { Key } from "react";
import { SelectionManager } from "@react-stately/selection";
export interface TreeProps<T> extends CollectionBase<T>, Expandable, MultipleSelection {
}
export interface TreeState<T> {
    /** A collection of items in the tree. */
    readonly collection: Collection<Node<T>>;
    /** A set of keys for items that are disabled. */
    readonly disabledKeys: Set<Key>;
    /** A set of keys for items that are expanded. */
    readonly expandedKeys: Set<Key>;
    /** Toggles the expanded state for an item by its key. */
    toggleKey(key: Key): void;
    /** A selection manager to read and update multiple selection state. */
    readonly selectionManager: SelectionManager;
}
/**
 * Provides state management for tree-like components. Handles building a collection
 * of items from props, item expanded state, and manages multiple selection state.
 */
export function useTreeState<T extends object>(props: TreeProps<T>): TreeState<T>;

//# sourceMappingURL=types.d.ts.map
