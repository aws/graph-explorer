import { RotateCcwIcon } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  ErrorDetailsButton,
} from "@/components";
import { useMaybeActiveSchema } from "@/core";
import { useTranslations } from "@/hooks";
import { useSchemaSync } from "@/hooks/useSchemaSync";
import { createDisplayError } from "@/utils/createDisplayError";

import { edgeConnectionNotice } from "./edgeConnectionNotice";

/**
 * Tells the user when edge connection discovery has failed or never ran,
 * without blocking the rest of the Schema view: node types still render.
 */
export function EdgeConnectionDiscoveryNotice() {
  const schema = useMaybeActiveSchema();
  const { edgeDiscoveryQuery } = useSchemaSync();
  const t = useTranslations();

  if (!schema) {
    return null;
  }

  const notice = edgeConnectionNotice(schema, edgeDiscoveryQuery.error);
  if (notice === null) {
    return null;
  }

  const retry = () => edgeDiscoveryQuery.refetch();

  if (notice.kind === "not-discovered") {
    return (
      <div className="p-3">
        <Alert>
          <AlertTitle>{t("edge-connections")} not discovered</AlertTitle>
          <AlertDescription>
            Node types are shown without the connections between them.
          </AlertDescription>
          <div className="flex gap-2">
            <Button size="small" onClick={retry}>
              Synchronize
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (notice.error == null) {
    return (
      <div className="p-3">
        <Alert variant="danger">
          <AlertTitle>Could not discover {t("edge-connections")}</AlertTitle>
          <AlertDescription>
            The last attempt failed. Retry to try again and see why.
          </AlertDescription>
          <div className="flex gap-2">
            <Button size="small" onClick={retry}>
              <RotateCcwIcon />
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  const displayError = createDisplayError(notice.error);
  return (
    <div className="p-3">
      <Alert variant="danger">
        <AlertTitle>{displayError.title}</AlertTitle>
        <AlertDescription>{displayError.message}</AlertDescription>
        <div className="flex gap-2">
          <ErrorDetailsButton error={notice.error} />
          <Button size="small" onClick={retry}>
            <RotateCcwIcon />
            Retry
          </Button>
        </div>
      </Alert>
    </div>
  );
}
