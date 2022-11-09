import { cx } from "@emotion/css";
import type {
  HTMLAttributes,
  MouseEvent,
  PropsWithChildren,
  ReactNode,
} from "react";
import { Children, useMemo } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import { ChevronDownIcon } from "../icons";
import defaultStyles from "./Section.styles";

export interface SectionProps
  extends Pick<HTMLAttributes<HTMLDivElement>, "style"> {
  classNamePrefix?: string;
  className?: string;
  unmountOnCollapse?: boolean;
  /**
   * Allows to remove the default padding.
   */
  disablePadding?: boolean;
  /**
   * Allows to remove the default border-bottom.
   */
  disableBorder?: boolean;
  /**
   * Add a title on the top of the section.
   */
  title?: ReactNode;
  /**
   * Add the ability to collapse the section.
   */
  collapsible?: boolean;
  /**
   * By default, collapsible section opens from top to down.
   * Reverse shows that the behavior is from bottom to up.
   */
  reverse?: boolean;
  /**
   * Define the if the section is collapsed or expanded.
   * It only works in combination with collapsible property.
   */
  isCollapse?: boolean;
  /**
   * Allows to modify the collapse adornment.
   */
  collapseAdornment?: ReactNode;
  collapseIndicatorPosition?: "start" | "end";
  collapseAction?: "indicator" | "all";
  showWhenEmpty?: boolean;
  /**
   * Triggered when collapse state is toggled.
   */
  onCollapseChange?(
    isCollapse: boolean,
    event: MouseEvent<HTMLDivElement>
  ): void;
}

export const Section = ({
  classNamePrefix = "ft",
  className,
  children,
  title,
  collapsible,
  reverse,
  isCollapse,
  onCollapseChange,
  unmountOnCollapse,
  collapseAdornment,
  style,
  collapseIndicatorPosition = "end",
  collapseAction = "indicator",
  showWhenEmpty = false,
  ...styleProps
}: PropsWithChildren<SectionProps>) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const headerContainer = useMemo(() => {
    if (!title && !collapsible) {
      return null;
    }

    const collapseIndicator = collapseAdornment || (
      <ChevronDownIcon
        style={{
          transition: "transform 250ms ease",
          transform: isCollapse
            ? `rotate(${reverse ? "-90deg" : "90deg"})`
            : `rotate(${reverse ? "90deg" : "-90deg"})`,
        }}
      />
    );
    return (
      <div
        className={pfx("header-container")}
        onClick={ev =>
          collapseAction === "all" && onCollapseChange?.(!isCollapse, ev)
        }
      >
        {collapsible && collapseIndicatorPosition === "start" && (
          <div
            className={pfx("collapse-action")}
            onClick={ev => onCollapseChange?.(!isCollapse, ev)}
          >
            {collapseIndicator}
          </div>
        )}
        <div className={pfx("title")}>{title}</div>
        {collapsible && collapseIndicatorPosition === "end" && (
          <div
            className={pfx("collapse-action")}
            onClick={ev => onCollapseChange?.(!isCollapse, ev)}
          >
            {collapseIndicator}
          </div>
        )}
      </div>
    );
  }, [
    collapseIndicatorPosition,
    collapseAdornment,
    onCollapseChange,
    collapseAction,
    collapsible,
    isCollapse,
    reverse,
    title,
    pfx,
  ]);

  // This allows to clean sections with conditional children or without them
  if (
    !showWhenEmpty &&
    !Children.toArray(children).reduce(
      (exists, child) => exists || !!child,
      false
    )
  ) {
    return null;
  }

  return (
    <section
      className={cx(
        styleWithTheme(
          defaultStyles({
            pfx: classNamePrefix,
            collapseAction,
            ...styleProps,
          })
        ),
        className
      )}
      style={style}
    >
      {headerContainer}
      {Children.count(children) > 0 && (
        <div className={pfx("content")}>
          {collapsible ? (
            <div
              className={cx(pfx("collapsible-container"), {
                [pfx("collapsed")]: isCollapse,
              })}
            >
              {unmountOnCollapse && isCollapse ? null : children}
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </section>
  );
};

export default Section;
