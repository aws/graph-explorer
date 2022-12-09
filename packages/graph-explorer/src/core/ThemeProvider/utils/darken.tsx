import Color from "color";

const darken = (color: string | undefined, amount: number) => {
  const colorInstance = new Color(color);
  const rgb = colorInstance.darken(amount);
  return rgb.toString();
};

export default darken;
