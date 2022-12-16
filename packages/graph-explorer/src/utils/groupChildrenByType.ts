import type { ComponentClass, FC, FunctionComponent, ReactNode } from "react";
import { Children } from "react";
import type { ReadonlyDeep } from "type-fest";

const groupChildrenByType = (
  children: ReadonlyDeep<ReactNode | ReactNode[]>,
  types: readonly (ComponentClass<any> | FunctionComponent | string)[] = [],
  rest = "rest"
): Record<string, ReactNode[]> => {
  const typeNames: string[] = types.map(type =>
    typeof type === "string" ? type : type.name
  );

  return Children.toArray(children).reduce(
    (acc: Record<string, ReactNode[]>, child: ReadonlyDeep<ReactNode>) => {
      const elementName =
        (child as { type: FC })?.type?.displayName ||
        (child as { type: FC })?.type?.name;
      const key =
        elementName !== null && typeNames.includes(elementName)
          ? elementName
          : rest;

      if (typeof acc[key] === "undefined") {
        acc[key] = [];
      }

      acc[key] = [...acc[key], child];

      return acc;
    },
    {}
  );
};

export default groupChildrenByType;
