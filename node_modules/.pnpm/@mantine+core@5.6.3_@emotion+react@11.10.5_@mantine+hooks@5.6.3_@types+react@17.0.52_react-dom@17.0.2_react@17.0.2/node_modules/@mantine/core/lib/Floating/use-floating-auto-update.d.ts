/// <reference types="react" />
interface Payload {
    opened: boolean;
    floating: {
        update(): void;
        refs: {
            floating: React.MutableRefObject<any>;
            reference: React.MutableRefObject<any>;
        };
    };
    positionDependencies: any[];
}
export declare function useFloatingAutoUpdate({ opened, floating, positionDependencies }: Payload): void;
export {};
//# sourceMappingURL=use-floating-auto-update.d.ts.map