import type { GraphRef } from "@/components/Graph/Graph";
import {
  createContext,
  useContext,
  useRef,
  type PropsWithChildren,
  type RefObject,
} from "react";

interface GraphContextValue {
  graphRef: RefObject<GraphRef | null>;
}

const GraphContext = createContext<GraphContextValue | null>(null);

export function GraphProvider({ children }: PropsWithChildren) {
  const graphRef = useRef<GraphRef | null>(null);

  return (
    <GraphContext.Provider value={{ graphRef }}>
      {children}
    </GraphContext.Provider>
  );
}

export function useGraphRef() {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error("useGraphRef must be used within a GraphProvider");
  }
  return context.graphRef;
}
