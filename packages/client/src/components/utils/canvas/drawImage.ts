import colorizeSvg from "./colorizeSvg";
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
   * Color for the icon if applicable.
   * SVG icons can be colored:
   * - if it is using "currentColor", it will be replaced by this color definition
   * - trying to replace all fill and stroke properties distinct of "none"
   */
  color?: string;

  /**
   * Store the image by src in a memory cache. By default, true
   */
  cache?: boolean;
};

async function fetchIcon(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    if (response.ok) {
      return await response.text();
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`Unable to fetch ${url}: ${err}`);
    }
  }
}

const IMAGES_CACHE: Record<string, HTMLImageElement> = {};
const IMAGES_PENDING: Set<string> = new Set();

const drawImage = (
  context: CanvasRenderingContext2D,
  boundingBox: BoundingBox,
  options: DrawImageOption = {}
) => {
  context.save();
  const { x, y, width, height } = boundingBox;
  const { src = "", cache = true, opacity = 1, color } = options;
  if (!src || IMAGES_PENDING.has(src)) {
    return;
  }

  const initialGlobalAlpha = context.globalAlpha;
  if (opacity !== context.globalAlpha) {
    context.globalAlpha = opacity;
  }

  if (cache && IMAGES_CACHE[`${src}::${color || "default"}`]) {
    context.drawImage(
      IMAGES_CACHE[`${src}::${color || "default"}`],
      x,
      y,
      width,
      height
    );

    if (initialGlobalAlpha !== context.globalAlpha) {
      context.globalAlpha = initialGlobalAlpha;
    }

    context.restore();
    return;
  }

  const createImage = (currentSrc: string) => {
    const img = new Image(width, height);
    img.onload = () => {
      context.drawImage(img, x, y, width, height);

      if (cache) {
        IMAGES_CACHE[`${src}::${color || "default"}`] = img;
      }

      if (initialGlobalAlpha !== context.globalAlpha) {
        context.globalAlpha = initialGlobalAlpha;
      }
    };

    img.src = currentSrc;
  };

  // TODO - prevent enqueue one request per drawn node
  // if (IMAGES_PENDING.has(`${src}::${color || "default"}`)) {
  //   context.restore();
  //   return;
  // }

  if (src.match(/\.svg$/i)) {
    IMAGES_PENDING.add(`${src}::${color || "default"}`);
    fetchIcon(src).then(icon => {
      IMAGES_PENDING.delete(`${src}::${color || "default"}`);

      let iconSrc = icon;
      if (icon && color) {
        iconSrc = colorizeSvg(icon, color);
      }

      if (!iconSrc) {
        return;
      }

      createImage(iconSrc);
      context.restore();
    });

    return;
  }

  createImage(src);
  context.restore();
};

export default drawImage;
