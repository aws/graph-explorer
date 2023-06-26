/// <reference types="react" />
import type { MantineColor } from '@mantine/styles';
interface CurveData extends React.ComponentPropsWithRef<'circle'> {
    value: number;
    color: MantineColor;
    tooltip?: React.ReactNode;
}
interface GetCurves {
    sections: CurveData[];
    size: number;
    thickness: number;
    renderRoundedLineCaps: boolean;
}
interface Curve {
    sum: number;
    offset: number;
    root: boolean;
    data: CurveData;
    lineRoundCaps?: boolean;
}
export declare function getCurves({ size, thickness, sections, renderRoundedLineCaps }: GetCurves): Curve[];
export {};
//# sourceMappingURL=get-curves.d.ts.map