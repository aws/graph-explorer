import { RefreshCcwIcon } from "lucide-react";

import {
  Button,
  InfoTooltip,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderDivider,
  PanelTitle,
  Spinner,
} from "@/components";
import {
  DownloadScreenshotButton,
  RerunLayoutButton,
  SelectLayout,
  ZoomInButton,
  ZoomOutButton,
  ZoomToFitButton,
} from "@/components/Graph";
import { useSchemaSync } from "@/hooks/useSchemaSync";
import { logger } from "@/utils";

import { schemaGraphLayoutAtom } from "./SchemaGraph";

/** Toolbar for schema graph with layout controls and schema refresh */
export function SchemaGraphToolbar() {
  return (
    <PanelHeader>
      <PanelTitle>
        Schema Graph{" "}
        <InfoTooltip>
          This schema was implicitly discovered by sampling the structure of the
          data and may not represent the complete schema.
        </InfoTooltip>
      </PanelTitle>
      <PanelHeaderActions className="gap-1.5">
        <SelectLayout
          className="max-w-64 min-w-auto"
          layoutAtom={schemaGraphLayoutAtom}
        />
        <RerunLayoutButton />
        <ZoomToFitButton />

        <div className="flex-1" />

        <DownloadScreenshotButton />

        <PanelHeaderDivider />

        <ZoomInButton />
        <ZoomOutButton />

        <PanelHeaderDivider />

        <SchemaRefreshButton />
      </PanelHeaderActions>
    </PanelHeader>
  );
}

function SchemaRefreshButton() {
  const { refreshSchema, isFetching } = useSchemaSync();

  const handleRefresh = () => {
    logger.log("Schema graph: refresh schema requested");
    refreshSchema();
  };

  return (
    <Button
      variant="outline"
      size="small"
      onClick={handleRefresh}
      disabled={isFetching}
    >
      <Spinner loading={isFetching}>
        <RefreshCcwIcon />
      </Spinner>
      Refresh Schema
    </Button>
  );
}
