import {
  CircleSlash2,
  FullscreenIcon,
  GitCompareArrowsIcon,
  ImageDownIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";

import { Button } from "@/components";
import { useClearGraph } from "@/hooks";

import { useGraphGlobalActions } from "./useGraphGlobalActions";

export function RerunLayoutButton() {
  const { onRunLayout } = useGraphGlobalActions();

  return (
    <Button
      tooltip="Re-run Layout"
      variant="ghost"
      size="icon"
      onClick={onRunLayout}
    >
      <GitCompareArrowsIcon />
    </Button>
  );
}

export function ZoomToFitButton() {
  const { onFitAllToCanvas } = useGraphGlobalActions();

  return (
    <Button
      tooltip="Zoom to Fit"
      variant="ghost"
      size="icon"
      onClick={onFitAllToCanvas}
    >
      <FullscreenIcon />
    </Button>
  );
}

export function ZoomInButton() {
  const { onZoomIn } = useGraphGlobalActions();

  return (
    <Button tooltip="Zoom in" variant="ghost" size="icon" onClick={onZoomIn}>
      <ZoomInIcon />
    </Button>
  );
}

export function ZoomOutButton() {
  const { onZoomOut } = useGraphGlobalActions();

  return (
    <Button tooltip="Zoom out" variant="ghost" size="icon" onClick={onZoomOut}>
      <ZoomOutIcon />
    </Button>
  );
}

export function DownloadScreenshotButton() {
  const { onSaveScreenshot } = useGraphGlobalActions();

  return (
    <Button
      tooltip="Download Screenshot"
      variant="ghost"
      size="icon"
      onClick={onSaveScreenshot}
    >
      <ImageDownIcon />
    </Button>
  );
}

export function ClearCanvasButton() {
  const onClearGraph = useClearGraph();

  return (
    <Button
      tooltip="Clear canvas"
      variant="danger-ghost"
      size="icon"
      onClick={onClearGraph}
    >
      <CircleSlash2 />
    </Button>
  );
}
