import { MantineNumberSize } from '@mantine/styles';
export declare type AccordionValue<Multiple extends boolean> = Multiple extends true ? string[] : string | null;
export declare type AccordionHeadingOrder = 2 | 3 | 4 | 5 | 6;
export declare type AccordionChevronPosition = 'left' | 'right';
export declare type AccordionVariant = 'default' | 'contained' | 'filled' | 'separated';
export interface AccordionStylesParams {
    variant: AccordionVariant;
    radius?: MantineNumberSize;
}
//# sourceMappingURL=Accordion.types.d.ts.map