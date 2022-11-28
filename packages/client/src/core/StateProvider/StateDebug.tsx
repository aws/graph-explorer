/* eslint-disable no-console */
import { useEffect, useRef } from "react";
import { useRecoilSnapshot } from "recoil";

export const successStyle =
  "color: #74C3B3; background: inherit; font-weight: bold; padding: inherit";
export const errorStyle =
  "color: #FF9AA2; background: inherit; font-weight: bold; padding: inherit";

const formatDate = () => {
  const date = new Date();
  return (
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0") +
    ":" +
    String(date.getSeconds()).padStart(2, "0") +
    "." +
    String(date.getMilliseconds()).padStart(3, "0")
  );
};

const StateDebug = () => {
  const snapshot = useRecoilSnapshot();

  const prevUpdates = useRef<Record<string, any>>({});

  useEffect(() => {
    console.group(`[State] - ${formatDate()}`);
    const updates = snapshot.getNodes_UNSTABLE({ isModified: true });
    for (const node of updates) {
      console.group(node.key);
      console.log(`%cPrev State`, errorStyle, prevUpdates.current[node.key]);
      console.log(
        `%cNext State`,
        successStyle,
        snapshot.getLoadable(node).contents
      );
      console.groupEnd();

      prevUpdates.current[node.key] = snapshot.getLoadable(node).contents;
    }
    console.groupEnd();
  }, [snapshot]);

  return null;
};

export default StateDebug;
