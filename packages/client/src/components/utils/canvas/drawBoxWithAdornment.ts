import addPadding, { AddPaddingOptions } from "./addPadding";
import adjustAnchor, { AdjustAnchorOptions } from "./adjustAnchor";
import applyStyle from "./applyStyle";
import drawImage, { DrawImageOption } from "./drawImage";
import drawRectangle, { DrawRectangleOptions } from "./drawRectangle";
import { AutoBoundingBox } from "./types";

export type TextStyle = {
  bold?: boolean;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
};

export type DrawBoxWithAdornmentOptions = DrawImageOption &
  DrawRectangleOptions &
  AddPaddingOptions &
  AdjustAnchorOptions &
  TextStyle & {
    title?: string;
    text?: string;
    maxWidth?: number;
    titleFormat?: "uppercase" | "lowercase";
  };

const BASE_FONT_FAMILY = `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`;

const applyTextStyles = (
  context: CanvasRenderingContext2D,
  textStyles: TextStyle
) => {
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = textStyles?.color ?? "rgba(255, 255, 255)";
  context.font = `${textStyles.bold ? "bold" : ""} ${
    textStyles?.fontSize || 8
  }px ${textStyles.fontFamily || BASE_FONT_FAMILY}`;
};

const truncateText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) => {
  let actualText = text;
  let actualWidth = context.measureText(actualText).width;

  if (actualWidth <= maxWidth) {
    return { width: actualWidth, text: actualText };
  }

  while (actualWidth > maxWidth) {
    actualText = actualText.substring(0, actualText.length - 4) + "...";
    actualWidth = context.measureText(actualText).width;
  }

  return { width: actualWidth, text: actualText };
};

const drawBoxWithAdornment = (
  context: CanvasRenderingContext2D,
  boundingBox: AutoBoundingBox,
  options: DrawBoxWithAdornmentOptions = {}
) => {
  context.save();
  const { title, text, src, maxWidth, titleFormat } = options;
  applyTextStyles(context, options);
  const fontHeight = parseInt(context.font);
  let actualText = text;

  let actualTitle =
    titleFormat === "uppercase"
      ? title?.toUpperCase()
      : titleFormat === "lowercase"
      ? title?.toLowerCase()
      : title;

  let actualBox = {
    ...boundingBox,
    height:
      boundingBox.height === "auto"
        ? actualTitle
          ? fontHeight * 2
          : fontHeight
        : boundingBox.height,
    width: boundingBox.width === "auto" ? 24 : boundingBox.width,
  };

  // If text is defined, adjust the box and truncate the text (if needed)
  if (text) {
    const textWidth = context.measureText(text).width;
    actualBox.width = Math.min(textWidth, maxWidth || Number.MAX_SAFE_INTEGER);
    const result = truncateText(context, text, actualBox.width);
    actualText = result.text;
  }

  // Max between the text and the title width (title won't be truncated)
  if (actualTitle) {
    const titleWidth = context.measureText(actualTitle).width;
    actualBox.width = Math.min(
      Math.max(titleWidth, actualBox.width),
      maxWidth || Number.MAX_SAFE_INTEGER
    );
    const result = truncateText(context, actualTitle, actualBox.width);
    actualTitle = result.text;
    applyTextStyles(context, {
      ...options,
      bold: true,
      fontSize: (options.fontSize || 6) - 2,
    });
  }

  // Book space for icon (default 8px + padding of 2px)
  const hasIconWithText = Boolean((title || text) && src);
  if (hasIconWithText) {
    actualBox.width += 8 + 4;
  }

  // Add padding and anchor adjustment
  actualBox = adjustAnchor(actualBox, options);
  actualBox = addPadding(actualBox, options);
  const TEXT_GAP = 1;

  drawRectangle(context, actualBox, options);
  applyStyle(context, options);

  // Only icon
  if (!title && !text && src) {
    drawImage(
      context,
      {
        ...boundingBox,
        height:
          boundingBox.height === "auto"
            ? actualTitle
              ? fontHeight * 2
              : fontHeight
            : boundingBox.height,
        width: boundingBox.width === "auto" ? fontHeight : boundingBox.width,
      },
      options
    );
  } else if (src) {
    drawImage(
      context,
      {
        x: actualBox.x + 2,
        y: actualBox.y + actualBox.height / 2 - 4,
        width: 8,
        height: 8,
      },
      options
    );
  }
  if (actualText) {
    applyTextStyles(context, options);
    context.textBaseline = actualTitle ? "bottom" : "middle";
    const fontHeight = parseInt(context.font);
    context.fillText(
      actualText,
      actualBox.x + actualBox.width / 2 + (hasIconWithText ? 5 : 0),
      actualTitle
        ? actualBox.y +
            TEXT_GAP +
            (actualBox.height > fontHeight * 2
              ? actualBox.height
              : fontHeight * 2) -
            (options.paddingBottom || 0)
        : actualBox.y + actualBox.height / 2
    );
  }

  if (actualTitle) {
    applyTextStyles(context, {
      ...options,
      bold: true,
      fontSize: (options.fontSize || 6) - 2,
    });
    context.textBaseline = "top";
    context.fillText(
      actualTitle,
      actualBox.x + actualBox.width / 2 + (hasIconWithText ? 5 : 0),
      actualBox.y + (options.paddingTop || 0)
    );
  }

  context.restore();
};

export default drawBoxWithAdornment;
