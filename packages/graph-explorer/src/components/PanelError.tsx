import { createDisplayError } from "../utils/createDisplayError";
import { PanelEmptyState } from "./PanelEmptyState";
import { GraphIcon } from "./icons";

export default function PanelError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  const displayError = createDisplayError(error);
  return (
    <PanelEmptyState
      variant={"error"}
      icon={<GraphIcon />}
      title={displayError.title}
      subtitle={displayError.message}
      onAction={onRetry}
      actionLabel="Retry"
    />
  );
}
