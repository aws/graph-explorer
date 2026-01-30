import { atom, useAtom } from "jotai";

export const DEFAULT_SCHEMA_SIDEBAR_WIDTH = 350;

const schemaExplorerSidebarWidthAtom = atom(DEFAULT_SCHEMA_SIDEBAR_WIDTH);

export function useSchemaExplorerSidebarSize() {
  const [sidebarWidth, setSidebarWidth] = useAtom(
    schemaExplorerSidebarWidthAtom,
  );

  const updateSidebarWidth = (deltaWidth: number) => {
    setSidebarWidth(prev => prev + deltaWidth);
  };

  return [sidebarWidth, updateSidebarWidth] as const;
}
