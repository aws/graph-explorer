import Color from "color";

const fade = (color: string | undefined, opacity: number) => {
  const colorInstance = new Color(color);
  const rgb = colorInstance.rgb().array();
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
};

export default fade;
