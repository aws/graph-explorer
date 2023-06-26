interface IsDisabled {
    date: Date;
    minDate?: Date;
    maxDate?: Date;
    excludeDate?(date: Date): boolean;
    disableOutsideEvents?: boolean;
    outside?: boolean;
}
export declare function isDisabled({ minDate, maxDate, excludeDate, disableOutsideEvents, date, outside, }: IsDisabled): boolean;
export {};
//# sourceMappingURL=is-disabled.d.ts.map