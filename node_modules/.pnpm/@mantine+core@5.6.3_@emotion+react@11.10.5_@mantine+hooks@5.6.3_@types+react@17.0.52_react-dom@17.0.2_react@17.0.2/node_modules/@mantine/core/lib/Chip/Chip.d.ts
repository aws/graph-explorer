import React from 'react';
import { DefaultProps, MantineNumberSize, MantineSize, MantineColor, Selectors } from '@mantine/styles';
import { ForwardRefWithStaticComponents } from '@mantine/utils';
import { ChipGroup } from './ChipGroup/ChipGroup';
import useStyles, { ChipStylesParams } from './Chip.styles';
export declare type ChipStylesNames = Selectors<typeof useStyles>;
export interface ChipProps extends DefaultProps<ChipStylesNames, ChipStylesParams>, Omit<React.ComponentPropsWithRef<'input'>, 'size' | 'onChange'> {
    /** Chip radius from theme or number to set value in px */
    radius?: MantineNumberSize;
    /** Predefined chip size */
    size?: MantineSize;
    /** Chip input type */
    type?: 'radio' | 'checkbox';
    /** Controls chip appearance, defaults to filled with dark theme and to outline in light theme */
    variant?: 'outline' | 'filled';
    /** Chip label */
    children: React.ReactNode;
    /** Checked state for controlled component */
    checked?: boolean;
    /** Default value for uncontrolled component */
    defaultChecked?: boolean;
    /** Calls when checked state changes */
    onChange?(checked: boolean): void;
    /** Active color from theme, defaults to theme.primaryColor */
    color?: MantineColor;
    /** Static id to bind input with label */
    id?: string;
    /** Props spread to wrapper element */
    wrapperProps?: Record<string, any>;
}
declare type ChipComponent = ForwardRefWithStaticComponents<ChipProps, {
    Group: typeof ChipGroup;
}>;
export declare const Chip: ChipComponent;
export {};
//# sourceMappingURL=Chip.d.ts.map