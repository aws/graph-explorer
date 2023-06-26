import React from 'react';
import { DefaultProps } from '@mantine/styles';
export interface KbdProps extends DefaultProps, React.ComponentPropsWithoutRef<'kbd'> {
    /** Keyboard key */
    children: React.ReactNode;
}
export declare const Kbd: React.ForwardRefExoticComponent<KbdProps & React.RefAttributes<HTMLElement>>;
//# sourceMappingURL=Kbd.d.ts.map