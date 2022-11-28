const colorizeSvg = (svgContent: string, color: string) => {
  const hasCurrentColor = svgContent.match("currentColor");
  let coloredSvg = svgContent;

  if (hasCurrentColor) {
    coloredSvg = svgContent.replace(/currentColor/gm, color);
  }

  return "data:image/svg+xml;utf8," + encodeURIComponent(coloredSvg);
};

export default colorizeSvg;
