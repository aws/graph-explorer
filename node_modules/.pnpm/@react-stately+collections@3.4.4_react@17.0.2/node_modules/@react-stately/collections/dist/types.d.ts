import { ItemRenderer, ItemProps, SectionProps, Collection, CollectionBase, Node } from "@react-types/shared";
import { Key, ReactElement, ReactNode } from "react";
export interface PartialNode<T> {
    type?: string;
    key?: Key;
    value?: T;
    element?: ReactElement;
    wrapper?: (element: ReactElement) => ReactElement;
    rendered?: ReactNode;
    textValue?: string;
    'aria-label'?: string;
    index?: number;
    renderer?: ItemRenderer<T>;
    hasChildNodes?: boolean;
    childNodes?: () => IterableIterator<PartialNode<T>>;
    props?: any;
    shouldInvalidate?: (context: unknown) => boolean;
}
export let Item: <T>(props: ItemProps<T>) => JSX.Element;
export let Section: <T>(props: SectionProps<T>) => JSX.Element;
type CollectionFactory<T, C extends Collection<Node<T>>> = (node: Iterable<Node<T>>, prev: C | null) => C;
export function useCollection<T extends object, C extends Collection<Node<T>> = Collection<Node<T>>>(props: CollectionBase<T>, factory: CollectionFactory<T, C>, context?: unknown, invalidators?: Array<any>): C;
export function getItemCount<T>(collection: Iterable<Node<T>>): number;

//# sourceMappingURL=types.d.ts.map
