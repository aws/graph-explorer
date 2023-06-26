import React from 'react';
import { DefaultProps, MantineNumberSize, MantineColor, Selectors } from '@mantine/styles';
import { GroupProps } from '../Group/Group';
import { PaginationItemProps } from './DefaultItem/DefaultItem';
import useStyles, { PaginationStylesParams } from './Pagination.styles';
export declare type PaginationStylesNames = Selectors<typeof useStyles>;
export interface PaginationProps extends DefaultProps<PaginationStylesNames, PaginationStylesParams>, Omit<GroupProps, 'classNames' | 'styles' | 'onChange'> {
    /** Change item component */
    itemComponent?: React.FC<PaginationItemProps>;
    /** Active item color from theme, defaults to theme.primaryColor */
    color?: MantineColor;
    /** Active initial page for uncontrolled component */
    initialPage?: number;
    /** Controlled active page number */
    page?: number;
    /** Total amount of pages */
    total: number;
    /** Siblings amount on left/right side of selected page */
    siblings?: number;
    /** Amount of elements visible on left/right edges */
    boundaries?: number;
    /** Callback fired after change of each page */
    onChange?: (page: number) => void;
    /** Callback to control aria-labels */
    getItemAriaLabel?: (page: number | 'dots' | 'prev' | 'next' | 'first' | 'last') => string | undefined;
    /** Spacing between items from theme or number to set value in px, defaults to theme.spacing.xs / 2 */
    spacing?: MantineNumberSize;
    /** Predefined item size or number to set width and height in px */
    size?: MantineNumberSize;
    /** Predefined item radius or number to set border-radius in px */
    radius?: MantineNumberSize;
    /** Show/hide jump to start/end controls */
    withEdges?: boolean;
    /** Show/hide prev/next controls */
    withControls?: boolean;
    /** Determines whether all controls should be disabled */
    disabled?: boolean;
}
export declare const Pagination: React.ForwardRefExoticComponent<PaginationProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Pagination.d.ts.map