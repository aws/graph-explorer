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
      icon={<GitCompareArrowsIcon />}
      variant="text"
      onClick={onRunLayout}
    />
  );
}

export function ZoomToFitButton() {
  const { onFitAllToCanvas } = useGraphGlobalActions();

  return (
    <IconButton
      tooltipText="Zoom to Fit"
      icon={<FullscreenIcon />}
      variant="text"
      onClick={onFitAllToCanvas}
    />
  );
}

export function ZoomInButton() {
  const { onZoomIn } = useGraphGlobalActions();

  return (
    <IconButton
      tooltipText="Zoom in"
      icon={<ZoomInIcon />}
      variant="text"
      onClick={onZoomIn}
    />
  );
}

export function ZoomOutButton() {
  const { onZoomOut } = useGraphGlobalActions();

  return (
    <IconButton
      tooltipText="Zoom out"
      icon={<ZoomOutIcon />}
      variant="text"
      onClick={onZoomOut}
    />
  );
}

export function DownloadScreenshotButton() {
  const { onSaveScreenshot } = useGraphGlobalActions();

  return (
    <IconButton
      tooltipText="Download Screenshot"
      icon={<ImageDownIcon />}
      variant="text"
      onClick={onSaveScreenshot}
    />
  );
}

export function ClearCanvasButton() {
  const onClearGraph = useClearGraph();

  return (
    <IconButton
      tooltipText="Clear canvas"
      icon={<CircleSlash2 />}
      variant="text"
      color="danger"
      onClick={onClearGraph}
    />
  );
}
