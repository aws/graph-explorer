import React from 'react';
import { DefaultProps } from '@mantine/styles';
import { ButtonGroupStylesParams } from './ButtonGroup.styles';
export interface ButtonGroupProps extends DefaultProps<never, ButtonGroupStylesParams>, React.ComponentPropsWithoutRef<'div'> {
    /** <Button /> components */
    children?: React.ReactNode;
    /** Switch between vertical and horizontal orientation */
    orientation?: 'vertical' | 'horizontal';
    /** Child <Button /> border width in px */
    buttonBorderWidth?: number;
}
export declare const ButtonGroup: React.ForwardRefExoticComponent<ButtonGroupProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=ButtonGroup.d.ts.map