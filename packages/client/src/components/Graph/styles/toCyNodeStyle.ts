import { CyNodeStyle, NodeStyle } from "../Graph.model";

const toCyNodeStyle = (nodeStyle: Partial<NodeStyle>): Partial<CyNodeStyle> => {
  return {
    backgroundColor: nodeStyle.background,
    backgroundFit: nodeStyle.backgroundFit,
    backgroundWidth: nodeStyle.backgroundWidth,
    backgroundHeight: nodeStyle.backgroundHeight,
    backgroundImage: nodeStyle.backgroundImage,
    backgroundOpacity: nodeStyle.backgroundOpacity,
    borderColor: nodeStyle.borderColor,
    borderOpacity: nodeStyle.borderOpacity,
    borderStyle: nodeStyle.borderStyle,
    borderWidth: nodeStyle.borderWidth,
    display: nodeStyle.visible === false ? "none" : undefined,
    fontSize: nodeStyle.text?.fontSize,
    height: nodeStyle.height,
    label: nodeStyle.label,
    opacity: nodeStyle.opacity,
    shape: nodeStyle.shape,
    textBackgroundColor: nodeStyle.text?.background,
    textBackgroundOpacity: nodeStyle.text?.opacity,
    textBackgroundPadding: nodeStyle.text?.padding,
    textBackgroundShape: nodeStyle.text?.shape,
    textBorderColor: nodeStyle.text?.border.color,
    textBorderOpacity: nodeStyle.text?.border.opacity,
    textBorderStyle: nodeStyle.text?.border.style,
    textBorderWidth: nodeStyle.text?.border.width,
    color: nodeStyle.text?.color,
    textHalign: nodeStyle.text?.hAlign,
    textMarginY: nodeStyle.text?.vMargin,
    textMaxWidth: nodeStyle.text?.maxWidth,
    minZoomedFontSize: nodeStyle.text?.minZoomedFontSize,
    textRotation: nodeStyle.text?.rotation,
    textValign: nodeStyle.text?.vAlign,
    textWrap: nodeStyle.text?.wrap,
    width: nodeStyle.width,
    underlayColor: nodeStyle.underlayColor,
    underlayOpacity: nodeStyle.underlayOpacity,
  };
};

export default toCyNodeStyle;
