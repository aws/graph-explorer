import React from 'react';
import { DefaultProps, Selectors } from '@mantine/styles';
import useStyles from './Swatches.styles';
export declare type SwatchesStylesNames = Selectors<typeof useStyles>;
export interface SwatchesProps extends DefaultProps<SwatchesStylesNames>, Omit<React.ComponentPropsWithoutRef<'div'>, 'onSelect'> {
    data: string[];
    swatchesPerRow?: number;
    focusable?: boolean;
    onChangeEnd?: (color: string) => void;
    __staticSelector?: string;
    setValue(value: string): void;
}
export declare function Swatches({ data, swatchesPerRow, focusable, classNames, styles, __staticSelector, unstyled, setValue, onChangeEnd, ...others }: SwatchesProps): JSX.Element;
export declare namespace Swatches {
    var displayName: string;
}
//# sourceMappingURL=Swatches.d.ts.map