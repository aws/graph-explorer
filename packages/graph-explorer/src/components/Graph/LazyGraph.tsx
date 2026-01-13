import { lazy, Suspense } from "react";

import type { GraphProps } from "./Graph";

// Lazy load the Graph component to defer loading the cytoscape bundle
const GraphImpl = lazy(() => import("./Graph"));

/**
 * Lazy-loaded Graph component wrapper.
 * Defers loading of the cytoscape bundle until the component is rendered.
 */
export default function Graph(props: GraphProps) {
  return (
    <Suspense>
      <GraphImpl {...props} />
    </Suspense>
  );
}
