import {
  AutoFitLeftIcon,
  Button,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelHeaderDivider,
  PanelTitle,
} from "@/components";
import { LABELS } from "@/utils";

import { useSchemaViewSidebar } from "./schemaViewLayout";

export function DetailsPanelHeader() {
  const { detailsAutoOpenOnSelection, toggleDetailsAutoOpen, closeSidebar } =
    useSchemaViewSidebar();

  return (
    <PanelHeader>
      <PanelTitle>{LABELS.SIDEBAR.SELECTION_DETAILS}</PanelTitle>
      <PanelHeaderActions>
        <Button
          tooltip="Automatically open on selection"
          variant={detailsAutoOpenOnSelection ? "primary" : "ghost"}
          size="icon-small"
          onClick={toggleDetailsAutoOpen}
        >
          <AutoFitLeftIcon />
        </Button>
        <PanelHeaderDivider />
        <PanelHeaderCloseButton onClose={closeSidebar} />
      </PanelHeaderActions>
    </PanelHeader>
  );
}
