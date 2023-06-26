import React from 'react';
import { DefaultProps, MantineSize, MantineNumberSize, Selectors } from '@mantine/styles';
import { InputVariant } from '../../Input';
import useStyles from './DefaultValue.styles';
export declare type DefaultValueStylesNames = Selectors<typeof useStyles>;
export interface MultiSelectValueProps extends DefaultProps<DefaultValueStylesNames>, React.ComponentPropsWithoutRef<'div'> {
    label: string;
    onRemove(): void;
    disabled: boolean;
    readOnly: boolean;
    size: MantineSize;
    radius: MantineNumberSize;
    variant: InputVariant;
}
export declare function DefaultValue({ label, classNames, styles, className, onRemove, disabled, readOnly, size, radius, variant, ...others }: MultiSelectValueProps): JSX.Element;
export declare namespace DefaultValue {
    var displayName: string;
}
//# sourceMappingURL=DefaultValue.d.ts.map