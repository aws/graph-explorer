import React from "react";

export default function usePrevious<T>(value: T): T | null {
  const [current, setCurrent] = React.useState(value);
  const [previous, setPrevious] = React.useState<T | null>(null);

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}
