import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { forwardRef, useEffect, useMemo } from "react";
import type { ArrowProps, LayerSide, UseLayerOptions } from "react-laag";
import { Arrow, useLayer } from "react-laag";
import { withClassNamePrefix } from "../../core";
import getChildOfType from "../../utils/getChildOfType";
import UseLayerOverlay from "./UseLayerOverlay";
import UseLayerTrigger from "./UseLayerTrigger";

export type UseLayerSides = LayerSide;

export type UseLayerProps = UseLayerOptions & {
  id?: string;
  showArrow?: boolean;
  arrowProps?: ArrowProps;
  onClose?(): void;
  className?: string;
  classNamePrefix?: string;
  onLayerSideChange?: (side: UseLayerSides) => void;
};

// eslint-disable-next-line react/display-name
const UseLayer = forwardRef<HTMLDivElement, PropsWithChildren<UseLayerProps>>(
  (
    {
      children,
      id,
      showArrow,
      arrowProps,
      className,
      classNamePrefix = "ft",
      onClose,
      placement,
      possiblePlacements,
      onLayerSideChange,
      ...layerOptions
    },
    ref
  ) => {
    const {
      renderLayer,
      layerSide,
      triggerProps,
      layerProps,
      arrowProps: layerArrowProps,
    } = useLayer({
      onParentClose: onClose,
      onDisappear: onClose,
      onOutsideClick: onClose,
      placement: placement || possiblePlacements?.[0] || "top-start",
      possiblePlacements,
      auto: true,
      ...layerOptions,
    });

    const pfx = withClassNamePrefix(classNamePrefix);

    useEffect(() => {
      onLayerSideChange?.(layerSide);
    }, [layerSide, onLayerSideChange]);

    const triggerChild = useMemo(() => {
      return getChildOfType(
        children,
        UseLayerTrigger.displayName || UseLayerTrigger.name
      );
    }, [children]);

    const overlayChild = useMemo(() => {
      return getChildOfType(
        children,
        UseLayerOverlay.displayName || UseLayerOverlay.name
      );
    }, [children]);

    if (!triggerChild || !overlayChild) {
      throw new Error(
        "UseLayer requires two children: <UseLayerTrigger/> and <UseLayerOverlay />"
      );
    }

    return (
      <div
        ref={ref}
        id={id}
        className={cx(pfx("layer-container"), className)}
        style={{ display: "inline-block" }}
      >
        <div {...triggerProps} className={pfx("trigger-container")}>
          {triggerChild}
        </div>
        {renderLayer(
          <div
            {...layerProps}
            style={{
              ...layerProps.style,
              zIndex: 9999,
            }}
            className={pfx("overlay-container")}
          >
            {layerOptions.isOpen && (
              <div className={pfx("overlay-inner-container")}>
                {showArrow && <Arrow {...layerArrowProps} {...arrowProps} />}
                {overlayChild}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default UseLayer;
