import { Collection, Node, CollectionBase, SingleSelection } from "@react-types/shared";
import { Key } from "react";
import { MultipleSelectionStateProps, SelectionManager } from "@react-stately/selection";
export class ListCollection<T> implements Collection<Node<T>> {
    constructor(nodes: Iterable<Node<T>>);
    [Symbol.iterator](): Generator<Node<T>, void, undefined>;
    get size(): number;
    getKeys(): IterableIterator<Key>;
    getKeyBefore(key: Key): Key;
    getKeyAfter(key: Key): Key;
    getFirstKey(): Key;
    getLastKey(): Key;
    getItem(key: Key): Node<T>;
    at(idx: number): Node<T>;
}
export interface ListProps<T> extends CollectionBase<T>, MultipleSelectionStateProps {
    /** Filter function to generate a filtered list of nodes. */
    filter?: (nodes: Iterable<Node<T>>) => Iterable<Node<T>>;
    /** @private */
    suppressTextValueWarning?: boolean;
}
export interface ListState<T> {
    /** A collection of items in the list. */
    collection: Collection<Node<T>>;
    /** A set of items that are disabled. */
    disabledKeys: Set<Key>;
    /** A selection manager to read and update multiple selection state. */
    selectionManager: SelectionManager;
}
/**
 * Provides state management for list-like components. Handles building a collection
 * of items from props, and manages multiple selection state.
 */
export function useListState<T extends object>(props: ListProps<T>): ListState<T>;
export interface SingleSelectListProps<T> extends CollectionBase<T>, Omit<SingleSelection, 'disallowEmptySelection'> {
    /** Filter function to generate a filtered list of nodes. */
    filter?: (nodes: Iterable<Node<T>>) => Iterable<Node<T>>;
    /** @private */
    suppressTextValueWarning?: boolean;
}
export interface SingleSelectListState<T> extends ListState<T> {
    /** The key for the currently selected item. */
    readonly selectedKey: Key;
    /** Sets the selected key. */
    setSelectedKey(key: Key): void;
    /** The value of the currently selected item. */
    readonly selectedItem: Node<T>;
}
/**
 * Provides state management for list-like components with single selection.
 * Handles building a collection of items from props, and manages selection state.
 */
export function useSingleSelectListState<T extends object>(props: SingleSelectListProps<T>): SingleSelectListState<T>;

//# sourceMappingURL=types.d.ts.map
