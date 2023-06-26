import React from 'react';
import { DefaultProps, MantineNumberSize } from '@mantine/styles';
export interface SpaceProps extends DefaultProps {
    /** Width, set to add horizontal spacing */
    w?: MantineNumberSize;
    /** Height, set to add vertical spacing */
    h?: MantineNumberSize;
}
export declare const Space: React.ForwardRefExoticComponent<SpaceProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Space.d.ts.map