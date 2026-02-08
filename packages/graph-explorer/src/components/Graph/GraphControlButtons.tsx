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
      title="Re-run Layout"
      variant="text"
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
      title="Zoom to Fit"
      variant="text"
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
    <Button title="Zoom in" variant="text" size="icon" onClick={onZoomIn}>
      <ZoomInIcon />
    </Button>
  );
}

export function ZoomOutButton() {
  const { onZoomOut } = useGraphGlobalActions();

  return (
    <Button title="Zoom out" variant="text" size="icon" onClick={onZoomOut}>
      <ZoomOutIcon />
    </Button>
  );
}

export function DownloadScreenshotButton() {
  const { onSaveScreenshot } = useGraphGlobalActions();

  return (
    <Button
      title="Download Screenshot"
      variant="text"
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
      title="Clear canvas"
      variant="text-danger"
      size="icon"
      onClick={onClearGraph}
    >
      <CircleSlash2 />
    </Button>
  );
}
