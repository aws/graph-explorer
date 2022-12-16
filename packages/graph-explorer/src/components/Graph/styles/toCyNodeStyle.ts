import { CyNodeStyle, NodeStyle } from "../Graph.model";

const toCyNodeStyle = (nodeStyle: Partial<NodeStyle>): Partial<CyNodeStyle> => {
  return {
    backgroundColor: nodeStyle.background,
    backgroundFit: nodeStyle.backgroundFit,
    backgroundHeight: nodeStyle.backgroundHeight,
    backgroundImage: nodeStyle.backgroundImage,
    backgroundOpacity: nodeStyle.backgroundOpacity,
    backgroundWidth: nodeStyle.backgroundWidth,
    borderColor: nodeStyle.borderColor,
    borderOpacity: nodeStyle.borderOpacity,
    borderStyle: nodeStyle.borderStyle,
    borderWidth: nodeStyle.borderWidth,
    color: nodeStyle.text?.color,
    display: nodeStyle.visible === false ? "none" : undefined,
    fontSize: nodeStyle.text?.fontSize,
    height: nodeStyle.height,
    label: nodeStyle.label,
    minZoomedFontSize: nodeStyle.text?.minZoomedFontSize,
    opacity: nodeStyle.opacity,
    padding: nodeStyle.padding,
    shape: nodeStyle.shape,
    textBackgroundColor: nodeStyle.text?.background,
    textBackgroundOpacity: nodeStyle.text?.opacity,
    textBackgroundPadding: nodeStyle.text?.padding,
    textBackgroundShape: nodeStyle.text?.shape,
    textBorderColor: nodeStyle.text?.border.color,
    textBorderOpacity: nodeStyle.text?.border.opacity,
    textBorderStyle: nodeStyle.text?.border.style,
    textBorderWidth: nodeStyle.text?.border.width,
    textHalign: nodeStyle.text?.hAlign,
    textMarginY: nodeStyle.text?.vMargin,
    textMaxWidth: nodeStyle.text?.maxWidth,
    textRotation: nodeStyle.text?.rotation,
    textValign: nodeStyle.text?.vAlign,
    textWrap: nodeStyle.text?.wrap,
    underlayColor: nodeStyle.underlayColor,
    underlayOpacity: nodeStyle.underlayOpacity,
    width: nodeStyle.width,
  };
};

export default toCyNodeStyle;
