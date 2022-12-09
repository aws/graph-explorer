import { cx } from "@emotion/css";
import { AnimatePresence, motion } from "framer-motion";
import type { PropsWithChildren, ReactNode, ReactText } from "react";
import { cloneElement, useEffect } from "react";
import { Arrow, useHover, useLayer } from "react-laag";
import type { PlacementType } from "react-laag/dist/PlacementType";
import { useTheme, useWithTheme } from "../../core";
import usePrevious from "../../hooks/usePrevious";
import { tooltipStyles } from "./Tooltip.styles";

function isReactText(children: ReactNode) {
  return ["string", "number"].includes(typeof children);
}

export type TooltipProps = {
  text: ReactNode | ReactText;
  placement?: PlacementType;
  delayEnter?: number;
  delayLeave?: number;
  triggerOffset?: number;
  className?: string;
  disabled?: boolean;
  onHoverChange?: (isOver: boolean) => void;
};

export const Tooltip = ({
  children,
  text,
  placement = "bottom-center",
  delayEnter = 100,
  delayLeave = 300,
  triggerOffset = 8,
  className,
  disabled,
  onHoverChange,
}: PropsWithChildren<TooltipProps>) => {
  const [isOver, hoverProps] = useHover({ delayEnter, delayLeave });
  const [isOverTooltip, hoverTooltipProps] = useHover({
    delayEnter,
    delayLeave,
  });
  const [theme] = useTheme();
  const { triggerProps, layerProps, arrowProps, renderLayer } = useLayer({
    isOpen: !disabled && (isOver || isOverTooltip),
    auto: true,
    placement,
    triggerOffset,
  });

  const prevIsOver = usePrevious(isOver);

  useEffect(() => {
    if (prevIsOver !== isOver) onHoverChange?.(isOver);
  }, [isOver, onHoverChange, prevIsOver]);
  // when children equals text (string | number), we need to wrap it in an
  // extra span-element in order to attach props
  let trigger;
  if (isReactText(children)) {
    trigger = (
      <div className="tooltip-text-wrapper" {...triggerProps} {...hoverProps}>
        {children}
      </div>
    );
  } else {
    // In case of an react-element, we need to clone it in order to attach our own props
    trigger = cloneElement(children as any, {
      ...triggerProps,
      ...hoverProps,
    });
  }

  const stylesWithTheme = useWithTheme();

  return (
    <>
      {trigger}
      {renderLayer(
        <AnimatePresence>
          {!disabled && (isOver || isOverTooltip) && (
            <motion.div
              className={cx(stylesWithTheme(tooltipStyles), className)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
              {...layerProps}
              style={{ pointerEvents: "none", ...layerProps.style }}
            >
              <span {...hoverTooltipProps}>{text}</span>
              <Arrow
                {...arrowProps}
                backgroundColor={
                  theme?.theme.tooltip?.background || "rgb(78, 78, 78)"
                }
                borderColor={
                  theme?.theme.tooltip?.border?.color || "transparent"
                }
                size={6}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
};

export default Tooltip;
