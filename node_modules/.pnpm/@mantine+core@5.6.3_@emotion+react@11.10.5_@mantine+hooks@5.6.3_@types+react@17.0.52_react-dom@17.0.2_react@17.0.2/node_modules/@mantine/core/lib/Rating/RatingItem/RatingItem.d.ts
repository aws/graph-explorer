import React from 'react';
import { MantineSize, Selectors, DefaultProps, MantineColor } from '@mantine/styles';
import useStyles from './RatingItem.styles';
export declare type RatingItemStylesNames = Selectors<typeof useStyles>;
export interface RatingItemProps extends DefaultProps<RatingItemStylesNames>, Omit<React.ComponentPropsWithoutRef<'input'>, 'value' | 'size'> {
    size: MantineSize;
    getSymbolLabel: (value: number) => string;
    emptyIcon?: React.ReactNode | ((value: number) => React.ReactNode);
    fullIcon?: React.ReactNode | ((value: number) => React.ReactNode);
    color: MantineColor;
    full: boolean;
    active: boolean;
    fractionValue: number;
    value: number;
    id: string;
}
export declare function RatingItem({ size, getSymbolLabel, emptyIcon, fullIcon, full, active, value, readOnly, fractionValue, classNames, styles, unstyled, color, id, ...others }: RatingItemProps): JSX.Element;
export declare namespace RatingItem {
    var displayName: string;
}
//# sourceMappingURL=RatingItem.d.ts.map