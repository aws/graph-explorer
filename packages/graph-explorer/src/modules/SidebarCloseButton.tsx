import { PanelHeaderCloseButton } from "@/components";
import { useSidebar } from "@/core";

export function SidebarCloseButton() {
  const { closeSidebar } = useSidebar();

  return <PanelHeaderCloseButton onClose={closeSidebar} />;
}
