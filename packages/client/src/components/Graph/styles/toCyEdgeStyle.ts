import { CyEdgeStyle, EdgeStyle } from "../Graph.model";

const toCyEdgeStyle = (edgeStyle: Partial<EdgeStyle>): Partial<CyEdgeStyle> => {
  return {
    curveStyle: edgeStyle.curveStyle,
    display: edgeStyle.visible === false ? "none" : undefined,
    fontSize: edgeStyle.text?.fontSize,
    label: edgeStyle.label,
    lineCap: edgeStyle.lineCap,
    lineColor: edgeStyle.lineColor,
    lineStyle: edgeStyle.lineStyle,
    opacity: edgeStyle.opacity,
    sourceArrowColor: edgeStyle.sourceArrowColor,
    sourceArrowShape: edgeStyle.sourceArrowShape,
    targetArrowColor: edgeStyle.targetArrowColor,
    targetArrowShape: edgeStyle.targetArrowShape,
    textBackgroundColor: edgeStyle.text?.background,
    textBackgroundOpacity: edgeStyle.text?.opacity,
    textBackgroundPadding: edgeStyle.text?.padding,
    textBackgroundShape: edgeStyle.text?.shape,
    textBorderColor: edgeStyle.text?.border.color,
    textBorderOpacity: edgeStyle.text?.border.opacity,
    textBorderStyle: edgeStyle.text?.border.style,
    textBorderWidth: edgeStyle.text?.border.width,
    color: edgeStyle.text?.color,
    textHalign: edgeStyle.text?.hAlign,
    textMaxWidth: edgeStyle.text?.maxWidth,
    minZoomedFontSize: edgeStyle.text?.minZoomedFontSize,
    textRotation: edgeStyle.text?.rotation,
    textValign: edgeStyle.text?.vAlign,
    textWrap: edgeStyle.text?.wrap,
    transitionDuration: edgeStyle.transitionDuration,
    transitionProperty: edgeStyle.transitionProperty,
    width: edgeStyle.width,
  };
};

export default toCyEdgeStyle;
