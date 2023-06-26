import { MantineSize, MantineTheme } from '@mantine/styles';
declare type Breakpoints<T> = Partial<Record<MantineSize | (string & {}), T>>;
export declare function getSortedBreakpoints<T>(breakpoints: Breakpoints<T>, theme: MantineTheme): [number, T][];
export {};
//# sourceMappingURL=get-sorted-breakpoints.d.ts.map