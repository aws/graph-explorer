declare type GenericHandler = (...args: any) => void;
/**
 * A generic subscription manager.
 */
export declare class SubscriptionManager<Handler extends GenericHandler> {
    private subscriptions;
    add(handler: Handler): () => undefined;
    notify(
    /**
     * Using ...args would be preferable but it's array creation and this
     * might be fired every frame.
     */
    a?: Parameters<Handler>[0], b?: Parameters<Handler>[1], c?: Parameters<Handler>[2]): void;
    clear(): void;
}
export {};
