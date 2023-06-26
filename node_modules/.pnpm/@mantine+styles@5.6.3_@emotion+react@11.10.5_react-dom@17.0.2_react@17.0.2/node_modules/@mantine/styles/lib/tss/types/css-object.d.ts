import * as CSS from 'csstype';
export interface CSSObject extends CSSPropertiesWithMultiValues, CSSPseudos, CSSOthersObject, CSSTssSpecials {
}
export declare type CSSTssSpecials = {
    ref?: string;
};
export declare type CSSProperties = CSS.PropertiesFallback<number | string>;
export declare type CSSPropertiesWithMultiValues = {
    [K in keyof CSSProperties]: CSSProperties[K] | Array<Extract<CSSProperties[K], string>>;
};
export declare type CSSPseudos = {
    [K in CSS.Pseudos]?: CSSObject;
};
export interface ArrayCSSInterpolation extends Array<CSSInterpolation> {
}
export interface ComponentSelector {
    __emotion_styles: any;
}
export declare type Keyframes = {
    name: string;
    styles: string;
    anim: number;
    toString: () => string;
} & string;
export interface SerializedStyles {
    name: string;
    styles: string;
    map?: string;
    next?: SerializedStyles;
}
export declare type InterpolationPrimitive = null | undefined | boolean | number | string | ComponentSelector | Keyframes | SerializedStyles | CSSObject;
export declare type CSSInterpolation = InterpolationPrimitive | ArrayCSSInterpolation;
export interface CSSOthersObject {
    [propertiesName: string]: CSSInterpolation;
}
//# sourceMappingURL=css-object.d.ts.map