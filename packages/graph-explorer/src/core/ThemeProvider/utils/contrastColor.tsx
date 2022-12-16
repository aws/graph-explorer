import Color from "color";

const contrastColor = (color: string | undefined) => {
  const colorInstance = new Color(color);
  if (colorInstance.isDark()) {
    return "black";
  }

  return "white";
};

export default contrastColor;
