import React from 'react';
import { DefaultProps, MantineNumberSize, MantineSize } from '@mantine/styles';
export interface ContainerProps extends DefaultProps, React.ComponentPropsWithoutRef<'div'> {
    /** Predefined container max-width or number for max-width in px */
    size?: MantineNumberSize;
    /** If fluid is set to true, size prop is ignored and Container can expand to 100% of width */
    fluid?: boolean;
    /** Container sizes */
    sizes?: Record<MantineSize, number>;
}
export declare const Container: React.ForwardRefExoticComponent<ContainerProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Container.d.ts.map