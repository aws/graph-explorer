import type { BoundingBox } from "./types";

export type DrawImageOption = {
  /**
   * Image source. It can be a data:image, a relative or absolute URL
   */
  src?: string;

  /**
   * Opacity that affects only to the image.
   */
  opacity?: number;

  /**
   * Store the image by src in a memory cache. By default, true
   */
  cache?: boolean;
};

const IMAGES_CACHE: Record<string, HTMLImageElement> = {};

const drawImage = (
  context: CanvasRenderingContext2D,
  boundingBox: BoundingBox,
  options: DrawImageOption = {},
) => {
  context.save();
  const { x, y, width, height } = boundingBox;
  const { src = "", cache = true, opacity = 1 } = options;
  if (!src) {
    return;
  }

  const initialGlobalAlpha = context.globalAlpha;
  if (opacity !== context.globalAlpha) {
    context.globalAlpha = opacity;
  }

  if (cache && IMAGES_CACHE[src]) {
    context.drawImage(IMAGES_CACHE[src], x, y, width, height);

    if (initialGlobalAlpha !== context.globalAlpha) {
      context.globalAlpha = initialGlobalAlpha;
    }

    context.restore();
    return;
  }

  const img = new Image(width, height);
  img.onload = () => {
    context.drawImage(img, x, y, width, height);

    if (cache) {
      IMAGES_CACHE[src] = img;
    }

    if (initialGlobalAlpha !== context.globalAlpha) {
      context.globalAlpha = initialGlobalAlpha;
    }
  };

  img.src = src;
  context.restore();
};

export default drawImage;
