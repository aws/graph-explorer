import React from 'react';
export interface FileButtonProps<Multiple extends boolean = false> {
    /** Called when files are picked */
    onChange(payload: Multiple extends true ? File[] : File | null): void;
    /** Function that receives button props and returns react node that should be rendered */
    children(props: {
        onClick(): void;
    }): React.ReactNode;
    /** Determines whether user can pick more than one file */
    multiple?: Multiple;
    /** File input accept attribute, for example, "image/png,image/jpeg" */
    accept?: string;
    /** Input name attribute */
    name?: string;
    /** Input form attribute */
    form?: string;
    /** Function that should be called when value changes to null or empty array */
    resetRef?: React.ForwardedRef<() => void>;
    /** Disables file picker */
    disabled?: boolean;
}
declare type FileButtonComponent = (<Multiple extends boolean = false>(props: FileButtonProps<Multiple>) => React.ReactElement) & {
    displayName?: string;
};
export declare const FileButton: FileButtonComponent;
export {};
//# sourceMappingURL=FileButton.d.ts.map