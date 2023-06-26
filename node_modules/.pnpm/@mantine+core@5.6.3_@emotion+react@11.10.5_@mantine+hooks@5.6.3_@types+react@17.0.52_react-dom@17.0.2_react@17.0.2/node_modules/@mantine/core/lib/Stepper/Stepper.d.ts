import React from 'react';
import { MantineColor, DefaultProps, MantineNumberSize, MantineSize, Selectors } from '@mantine/styles';
import { ForwardRefWithStaticComponents } from '@mantine/utils';
import { Step, StepStylesNames } from './Step/Step';
import { StepCompleted } from './StepCompleted/StepCompleted';
import useStyles from './Stepper.styles';
export declare type StepperStylesNames = Selectors<typeof useStyles> | StepStylesNames;
export interface StepperProps extends DefaultProps<StepperStylesNames>, React.ComponentPropsWithRef<'div'> {
    /** <Stepper.Step /> components only */
    children: React.ReactNode;
    /** Called when step is clicked */
    onStepClick?(stepIndex: number): void;
    /** Active step index */
    active: number;
    /** Step icon displayed when step is completed */
    completedIcon?: React.ReactNode;
    /** Step icon displayed when step is in progress */
    progressIcon?: React.ReactNode;
    /** Active and progress Step colors from theme.colors */
    color?: MantineColor;
    /** Step icon size in px */
    iconSize?: number;
    /** Content padding-top from theme.spacing or number to set value in px */
    contentPadding?: MantineNumberSize;
    /** Component orientation */
    orientation?: 'vertical' | 'horizontal';
    /** Icon position relative to step body */
    iconPosition?: 'right' | 'left';
    /** Component size */
    size?: MantineSize;
    /** Radius from theme.radius, or number to set border-radius in px */
    radius?: MantineNumberSize;
    /** Breakpoint at which orientation will change from horizontal to vertical */
    breakpoint?: MantineNumberSize;
}
declare type StepperComponent = ForwardRefWithStaticComponents<StepperProps, {
    Step: typeof Step;
    Completed: typeof StepCompleted;
}>;
export declare const Stepper: StepperComponent;
export {};
//# sourceMappingURL=Stepper.d.ts.map