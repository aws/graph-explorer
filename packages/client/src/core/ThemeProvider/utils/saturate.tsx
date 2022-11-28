import Color from "color";

const saturate = (color: string | undefined, amount: number) => {
  const colorInstance = new Color(color);
  const rgb = colorInstance.saturate(amount);
  return rgb.toString();
};

export default saturate;
