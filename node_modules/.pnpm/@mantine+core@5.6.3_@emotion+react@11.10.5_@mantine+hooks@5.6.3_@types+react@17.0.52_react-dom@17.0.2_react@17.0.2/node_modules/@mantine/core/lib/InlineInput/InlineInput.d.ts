import React from 'react';
import { DefaultProps, MantineSize, Selectors } from '@mantine/styles';
import useStyles from './InlineInput.styles';
export declare type InlineInputStylesNames = Selectors<typeof useStyles>;
export interface InlineInputProps extends DefaultProps<InlineInputStylesNames>, React.ComponentPropsWithoutRef<'div'> {
    __staticSelector: string;
    label: React.ReactNode;
    description: React.ReactNode;
    id: string;
    disabled: boolean;
    error: React.ReactNode;
    size: MantineSize;
    labelPosition: 'left' | 'right';
}
export declare function InlineInput({ __staticSelector, className, classNames, styles, unstyled, children, label, description, id, disabled, error, size, labelPosition, ...others }: InlineInputProps): JSX.Element;
export declare namespace InlineInput {
    var displayName: string;
}
//# sourceMappingURL=InlineInput.d.ts.map