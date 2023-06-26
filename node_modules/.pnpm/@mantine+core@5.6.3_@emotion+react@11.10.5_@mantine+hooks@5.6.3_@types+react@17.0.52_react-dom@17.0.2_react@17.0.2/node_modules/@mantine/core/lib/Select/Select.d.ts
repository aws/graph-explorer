import React from 'react';
import { DefaultProps, MantineSize, MantineShadow } from '@mantine/styles';
import { MantineTransition } from '../Transition';
import { SelectItem, BaseSelectStylesNames, BaseSelectProps } from './types';
export interface SelectSharedProps<Item, Value> {
    /** Select data used to renderer items in dropdown */
    data: (string | Item)[];
    /** Controlled input value */
    value?: Value;
    /** Uncontrolled input defaultValue */
    defaultValue?: Value;
    /** Controlled input onChange handler */
    onChange?(value: Value): void;
    /** Function based on which items in dropdown are filtered */
    filter?(value: string, item: Item): boolean;
    /** Input size */
    size?: MantineSize;
    /** Dropdown body appear/disappear transition */
    transition?: MantineTransition;
    /** Dropdown body transition duration */
    transitionDuration?: number;
    /** Dropdown body transition timing function, defaults to theme.transitionTimingFunction */
    transitionTimingFunction?: string;
    /** Dropdown shadow from theme or any value to set box-shadow */
    shadow?: MantineShadow;
    /** Initial dropdown opened state */
    initiallyOpened?: boolean;
    /** Change item renderer */
    itemComponent?: React.FC<any>;
    /** Called when dropdown is opened */
    onDropdownOpen?(): void;
    /** Called when dropdown is closed */
    onDropdownClose?(): void;
    /** Whether to render the dropdown in a Portal */
    withinPortal?: boolean;
    /** Limit amount of items displayed at a time for searchable select */
    limit?: number;
    /** Nothing found label */
    nothingFound?: React.ReactNode;
    /** Dropdown z-index */
    zIndex?: React.CSSProperties['zIndex'];
    /** Dropdown positioning behavior */
    dropdownPosition?: 'bottom' | 'top' | 'flip';
    /** Whether to switch item order and keyboard navigation on dropdown position flip */
    switchDirectionOnFlip?: boolean;
    /** useEffect dependencies to force update dropdown position */
    positionDependencies?: any[];
}
export interface SelectProps extends DefaultProps<BaseSelectStylesNames>, BaseSelectProps, SelectSharedProps<SelectItem, string | null> {
    /** Maximum dropdown height in px */
    maxDropdownHeight?: number;
    /** Set to true to enable search */
    searchable?: boolean;
    /** Allow to clear item */
    clearable?: boolean;
    /** aria-label for clear button */
    clearButtonLabel?: string;
    /** Called each time search value changes */
    onSearchChange?(query: string): void;
    /** Controlled search input value */
    searchValue?: string;
    /** Allow creatable option  */
    creatable?: boolean;
    /** Function to get create Label */
    getCreateLabel?(query: string): React.ReactNode;
    /** Function to determine if create label should be displayed */
    shouldCreate?(query: string, data: SelectItem[]): boolean;
    /** Called when create option is selected */
    onCreate?(query: string): SelectItem | string | null | undefined;
    /** Change dropdown component, can be used to add native scrollbars */
    dropdownComponent?: any;
    /** Select highlighted item on blur */
    selectOnBlur?: boolean;
    /** Allow deselecting items on click */
    allowDeselect?: boolean;
    /** Should data be filtered when search value exactly matches selected item */
    filterDataOnExactSearchMatch?: boolean;
    /** Set the clear button tab index to disabled or default after input field */
    clearButtonTabIndex?: -1 | 0;
}
export declare function defaultFilter(value: string, item: SelectItem): boolean;
export declare function defaultShouldCreate(query: string, data: SelectItem[]): boolean;
export declare const Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<HTMLInputElement>>;
//# sourceMappingURL=Select.d.ts.map