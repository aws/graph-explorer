import Color from "color";

const lighten = (color: string | undefined, amount: number) => {
  const colorInstance = new Color(color);
  const rgb = colorInstance.lighten(amount);
  return rgb.hex();
};

export default lighten;
