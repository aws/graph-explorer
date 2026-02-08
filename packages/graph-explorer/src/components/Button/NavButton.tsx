import type { ComponentPropsWithRef } from "react";
import type { NavigateOptions, To } from "react-router";

import { useNavigate } from "react-router";

import { Button } from "./Button";

export interface NavButtonProps extends Omit<
  ComponentPropsWithRef<typeof Button>,
  "onClick" | "asChild"
> {
  /** The path to navigate to when clicked. */
  to: To;
  /** Options for the navigation. */
  navOptions?: NavigateOptions;
}

/**
 * A button component that navigates to a route when clicked.
 * Unlike using Button with asChild and Link, this component properly
 * supports the disabled state by preventing navigation.
 */
function NavButton({ to, navOptions, ...props }: NavButtonProps) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(to, navOptions);
  }

  return <Button {...props} onClick={handleClick} />;
}

export { NavButton };
