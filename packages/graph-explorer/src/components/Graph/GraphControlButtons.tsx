import {
  CircleSlash2,
  FullscreenIcon,
  GitCompareArrowsIcon,
  ImageDownIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";

import { IconButton } from "@/components";
import { useClearGraph } from "@/hooks";

import { useGraphGlobalActions } from "./useGraphGlobalActions";

export function RerunLayoutButton() {
  const { onRunLayout } = useGraphGlobalActions();

  return (
    <IconButton
      tooltipText="Re-run Layout"
      variant="text"
      onClick={onRunLayout}
    >
      <GitCompareArrowsIcon />
    </IconButton>
  );
}

export function ZoomToFitButton() {
  const { onFitAllToCanvas } = useGraphGlobalActions();

  return (
    <IconButton
      tooltipText="Zoom to Fit"
      variant="text"
      onClick={onFitAllToCanvas}
    >
      <FullscreenIcon />
    </IconButton>
  );
}

export function ZoomInButton() {
  const { onZoomIn } = useGraphGlobalActions();

  return (
    <IconButton
      tooltipText="Zoom in"
      variant="text"
      onClick={onZoomIn}
    >
      <ZoomInIcon />
    </IconButton>
  );
}

export function ZoomOutButton() {
  const { onZoomOut } = useGraphGlobalActions();

  return (
    <IconButton
      tooltipText="Zoom out"
      variant="text"
      onClick={onZoomOut}
    >
      <ZoomOutIcon />
    </IconButton>
  );
}

export function DownloadScreenshotButton() {
  const { onSaveScreenshot } = useGraphGlobalActions();

  return (
    <IconButton
      tooltipText="Download Screenshot"
      variant="text"
      onClick={onSaveScreenshot}
    >
      <ImageDownIcon />
    </IconButton>
  );
}

export function ClearCanvasButton() {
  const onClearGraph = useClearGraph();

  return (
    <IconButton
      tooltipText="Clear canvas"
      variant="text"
      color="danger"
      onClick={onClearGraph}
    >
      <CircleSlash2 />
    </IconButton>
  );
}
