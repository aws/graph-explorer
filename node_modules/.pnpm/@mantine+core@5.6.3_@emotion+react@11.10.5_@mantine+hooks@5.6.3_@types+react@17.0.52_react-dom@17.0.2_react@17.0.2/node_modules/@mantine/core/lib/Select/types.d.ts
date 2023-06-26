/// <reference types="react" />
import type { InputStylesNames, InputSharedProps, InputWrapperStylesNames, InputWrapperBaseProps } from '../Input';
import type { SelectItemsStylesNames } from './SelectItems/SelectItems';
import type { SelectPopoverStylesNames } from './SelectPopover/SelectPopover';
export interface SelectItem {
    value: string;
    label?: string;
    disabled?: boolean;
    group?: string;
    [key: string]: any;
}
export declare type BaseSelectStylesNames = InputStylesNames | InputWrapperStylesNames | SelectItemsStylesNames | SelectPopoverStylesNames;
export declare type BaseSelectProps = InputWrapperBaseProps & InputSharedProps & Omit<React.ComponentPropsWithoutRef<'input'>, 'value' | 'onChange' | 'size' | 'defaultValue'>;
//# sourceMappingURL=types.d.ts.map