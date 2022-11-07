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
  tableRef: RefObject<HTMLDivElement>;
  instance: TabularInstance<T>;
  headerControlsRef: RefObject<HTMLDivElement>;
  headerControlsPosition?: string;
  setHeaderControlsPosition(position: CSSProperties["position"]): void;
  disablePagination?: boolean;
};

const createTabularContext = <T extends object = any>(
  defaultValue: TabularContextValue<T>
) => {
  return createContext<TabularContextValue<T>>(defaultValue);
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const TabularContext = createTabularContext(undefined!);

const TabularControlsProvider = <T extends object>({
  tabularInstance,
  children,
}: PropsWithChildren<{ tabularInstance: TabularInstance<T> }>) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const headerControlsRef = useRef<HTMLDivElement>(null);
  const [headerControlsPosition, setHeaderControlsPosition] = useState<
    CSSProperties["position"]
  >();

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
