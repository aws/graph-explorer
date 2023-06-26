import { ReactNode, ReactPortal, MutableRefObject } from "react";
import { Options, LayerSide, Styles, RefCallback, Container } from "./types";
export declare function setGlobalContainer(container: Container): void;
export declare type LayerProps = {
    ref: RefCallback;
    style: Styles["layer"];
};
export declare type TriggerProps = {
    ref: RefCallback;
};
export declare type UseLayerArrowProps = {
    ref: MutableRefObject<any> | RefCallback;
    layerSide: LayerSide;
    style: Styles["arrow"];
};
export declare type UseLayerProps = {
    renderLayer: (children: ReactNode) => ReactPortal | null;
    triggerProps: TriggerProps;
    layerProps: LayerProps;
    arrowProps: UseLayerArrowProps;
    layerSide: LayerSide;
    triggerBounds: ClientRect | null;
};
export declare const DEFAULT_OPTIONS: Required<Omit<Options, "ResizeObserver" | "environment" | "onParentClose" | "onOutsideClick" | "onDisappear" | "isOpen" | "layerDimensions">>;
export declare function useLayer({ isOpen, overflowContainer, environment, ResizeObserver: ResizeObserverPolyfill, placement, possiblePlacements, preferX, preferY, auto, snap, triggerOffset, containerOffset, arrowOffset, container, layerDimensions, onDisappear, onOutsideClick, onParentClose, trigger: triggerOption }: Options): UseLayerProps;
