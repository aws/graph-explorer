import { PanelHeaderCloseButton } from "@/components";
import { useCloseSidebar } from "@/core";

export function SidebarCloseButton() {
  const closeSidebar = useCloseSidebar();

  return <PanelHeaderCloseButton onClose={closeSidebar} />;
}
