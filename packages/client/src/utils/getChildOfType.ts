import type { FC, ReactNode } from "react";
import { Children, isValidElement } from "react";

const getChildOfType = (children: ReactNode, type: string) => {
  return (
    Children.toArray(children).find(child => {
      if (!child || !isValidElement(child)) {
        return false;
      }

      return (child as { type: FC }).type.displayName === type;
    }) || null
  );
};

export default getChildOfType;
