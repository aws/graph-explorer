import React from 'react';
import { DefaultProps, MantineColor, Selectors, MantineSize, MantineNumberSize } from '@mantine/styles';
import useStyles from './Step.styles';
export declare type StepStylesNames = Selectors<typeof useStyles>;
export interface StepProps extends DefaultProps<StepStylesNames>, React.ComponentPropsWithoutRef<'button'> {
    /** Step state, controlled by Steps component */
    state?: 'stepInactive' | 'stepProgress' | 'stepCompleted';
    /** Step color from theme.colors */
    color?: MantineColor;
    /** Should icon be displayed */
    withIcon?: boolean;
    /** Step icon, defaults to step index + 1 when rendered within Stepper */
    icon?: React.ReactNode;
    /** Step icon displayed when step is completed */
    completedIcon?: React.ReactNode;
    /** Step icon displayed when step is in progress */
    progressIcon?: React.ReactNode;
    /** Step label, render after icon */
    label?: React.ReactNode;
    /** Step description */
    description?: React.ReactNode;
    /** Icon wrapper size in px */
    iconSize?: number;
    /** Icon position relative to step body */
    iconPosition?: 'right' | 'left';
    /** Component size */
    size?: MantineSize;
    /** Radius from theme.radius, or number to set border-radius in px */
    radius?: MantineNumberSize;
    /** Indicates loading state on step */
    loading?: boolean;
    /** Set to false to disable clicks on step */
    allowStepClick?: boolean;
    /** Should step selection be allowed */
    allowStepSelect?: boolean;
    /** Static selector base */
    __staticSelector?: string;
    /** Component orientation */
    orientation?: 'vertical' | 'horizontal';
}
export declare const Step: React.ForwardRefExoticComponent<StepProps & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=Step.d.ts.map