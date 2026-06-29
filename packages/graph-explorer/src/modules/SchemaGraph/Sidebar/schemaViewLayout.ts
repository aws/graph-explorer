import { useAtom } from "jotai";

import type { SchemaViewSidebarItem } from "@/core/StateProvider/schemaViewLayoutDefaults";

import { DEFAULT_SIDEBAR_WIDTH } from "@/core/StateProvider/graphViewLayoutDefaults";
import { schemaViewLayoutAtom } from "@/core/StateProvider/storageAtoms";

export type { SchemaViewSidebarItem } from "@/core/StateProvider/schemaViewLayoutDefaults";

export function useSchemaViewSidebar() {
  const [layout, setLayout] = useAtom(schemaViewLayoutAtom);

  const activeSidebarItem = layout.activeSidebarItem;
  const isSidebarOpen = activeSidebarItem !== null;
  const sidebarWidth = layout.sidebar?.width ?? DEFAULT_SIDEBAR_WIDTH;

  function closeSidebar() {
    setLayout(prev => ({ ...prev, activeSidebarItem: null }));
  }

  function toggleSidebar(item: SchemaViewSidebarItem) {
    setLayout(prev => ({
      ...prev,
      activeSidebarItem: prev.activeSidebarItem === item ? null : item,
    }));
  }

  function setSidebarWidth(deltaWidth: number) {
    setLayout(prev => ({
      ...prev,
      sidebar: {
        ...prev.sidebar,
        width: (prev.sidebar?.width ?? DEFAULT_SIDEBAR_WIDTH) + deltaWidth,
      },
    }));
  }

  const detailsAutoOpenOnSelection = layout.detailsAutoOpenOnSelection ?? true;

  function toggleDetailsAutoOpen() {
    setLayout(prev => ({
      ...prev,
      detailsAutoOpenOnSelection: !(prev.detailsAutoOpenOnSelection ?? true),
    }));
  }

  function autoOpenDetails() {
    setLayout(prev =>
      prev.detailsAutoOpenOnSelection === false
        ? prev
        : { ...prev, activeSidebarItem: "details" },
    );
  }

  return {
    activeSidebarItem,
    isSidebarOpen,
    sidebarWidth,
    closeSidebar,
    toggleSidebar,
    setSidebarWidth,
    detailsAutoOpenOnSelection,
    toggleDetailsAutoOpen,
    autoOpenDetails,
  };
}
