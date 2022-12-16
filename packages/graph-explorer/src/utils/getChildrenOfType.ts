import type { FC, ReactNode } from "react";
import { Children, isValidElement } from "react";

/* filter a list of react children and return only the ones with a certain type*/
const getChildrenOfType = (
  children: ReactNode,
  type: string | string[],
  inverseSelection?: boolean
) => {
  const actualTypes = Array.isArray(type) ? type : [type];
  return (
    Children.toArray(children).filter(child => {
      if (inverseSelection && (!child || !isValidElement(child))) {
        return true;
      }

      if (!child || !isValidElement(child)) {
        return false;
      }

      const childType =
        (child as { type: FC }).type.displayName ||
        (child as { type: FC }).type.name;

      if (inverseSelection) {
        return !actualTypes.includes(childType);
      }

      return actualTypes.includes(childType);
    }) || null
  );
};

export default getChildrenOfType;
