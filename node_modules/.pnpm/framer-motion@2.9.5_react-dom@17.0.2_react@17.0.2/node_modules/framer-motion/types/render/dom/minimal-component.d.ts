/// <reference types="react" />
/**
 * @public
 */
export declare const m: import("./types").HTMLMotionComponents & import("./types").SVGMotionComponents & {
    custom: <Props>(Component: string | import("react").ComponentClass<Props, any> | import("react").FunctionComponent<Props>) => import(".").CustomDomComponent<Props>;
};
