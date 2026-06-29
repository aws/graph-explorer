import { PanelHeaderCloseButton } from "@/components";
import { useGraphViewSidebar } from "@/core";

export function SidebarCloseButton() {
  const { closeSidebar } = useGraphViewSidebar();

  return <PanelHeaderCloseButton onClose={closeSidebar} />;
}
