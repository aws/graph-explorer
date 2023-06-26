import React from 'react';
import { MantineNumberSize } from '@mantine/styles';
interface InputsGroupProps {
    spacing: MantineNumberSize;
    offset: MantineNumberSize;
    orientation: 'horizontal' | 'vertical';
    role?: string;
    children: React.ReactNode;
    unstyled?: boolean;
}
export declare function InputsGroup({ spacing, offset, orientation, children, role, unstyled, }: InputsGroupProps): JSX.Element;
export {};
//# sourceMappingURL=InputsGroup.d.ts.map