import {
  createContext,
  CSSProperties,
  PropsWithChildren,
  RefObject,
  useContext,
  useRef,
  useState,
} from "react";

import type { TabularInstance } from "./helpers/tableInstanceToTabularInstance";

type TabularContextValue<T extends object> = {
  tableRef: RefObject<HTMLDivElement | null>;
  instance: TabularInstance<T>;
  headerControlsRef: RefObject<HTMLDivElement | null>;
  headerControlsPosition?: string;
  setHeaderControlsPosition(position: CSSProperties["position"]): void;
  disablePagination?: boolean;
};

const createTabularContext = <T extends object = any>(
  defaultValue: TabularContextValue<T>
) => {
  return createContext<TabularContextValue<T>>(defaultValue);
};

const TabularContext = createTabularContext(undefined!);

const TabularControlsProvider = <T extends object>({
  tabularInstance,
  children,
}: PropsWithChildren<{ tabularInstance: TabularInstance<T> }>) => {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const headerControlsRef = useRef<HTMLDivElement | null>(null);
  const [headerControlsPosition, setHeaderControlsPosition] =
    useState<CSSProperties["position"]>();

  return (
    <TabularContext.Provider
      value={{
        instance: tabularInstance,
        tableRef,
        headerControlsRef,
        headerControlsPosition,
        setHeaderControlsPosition,
      }}
    >
      {children}
    </TabularContext.Provider>
  );
};

export default TabularControlsProvider;

export const useTabularControl = () => useContext(TabularContext);
